
import io
import zipfile
from datetime import datetime
from app.core.database import get_database_connection
from psycopg2.extras import RealDictCursor

class SimpleXLSXWriter:
    def __init__(self):
        self.sheets = []
        
    def add_sheet(self, name, rows):
        self.sheets.append({"name": name, "rows": rows})
        
    def _escape_xml(self, text):
        if text is None:
            return ""
        text = str(text)
        text = text.replace("&", "&amp;")
        text = text.replace("<", "&lt;")
        text = text.replace(">", "&gt;")
        text = text.replace('"', "&quot;")
        text = text.replace("'", "&apos;")
        return text

    def save(self):
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zf:
            content_types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            for i in range(len(self.sheets)):
                content_types += f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            content_types += '</Types>'
            zf.writestr('[Content_Types].xml', content_types)

            rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
            zf.writestr('_rels/.rels', rels)

            workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
            for i, sheet in enumerate(self.sheets):
                workbook += f'<sheet name="{self._escape_xml(sheet["name"])}" sheetId="{i+1}" r:id="rId{i+1}"/>'
            workbook += '</sheets></workbook>'
            zf.writestr('xl/workbook.xml', workbook)

            wb_rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            for i in range(len(self.sheets)):
                wb_rels += f'<Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i+1}.xml"/>'
            wb_rels += '</Relationships>'
            zf.writestr('xl/_rels/workbook.xml.rels', wb_rels)

            for i, sheet in enumerate(self.sheets):
                ws = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
                for row_idx, row in enumerate(sheet['rows']):
                    ws += f'<row r="{row_idx+1}">'
                    for col_idx, cell in enumerate(row):
                        c = col_idx
                        col_str = ""
                        while c >= 0:
                            col_str = chr(c % 26 + 65) + col_str
                            c = c // 26 - 1
                        cell_ref = f"{col_str}{row_idx+1}"
                        val = self._escape_xml(cell)
                        ws += f'<c r="{cell_ref}" t="inlineStr"><is><t>{val}</t></is></c>'
                    ws += '</row>'
                ws += '</sheetData></worksheet>'
                zf.writestr(f'xl/worksheets/sheet{i+1}.xml', ws)

        output.seek(0)
        return output

class ReportsXLSXService:
    def get_all_reports_xlsx(self):
        writer = SimpleXLSXWriter()
        conn = get_database_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # Pre-fetch general stats
                cursor.execute('SELECT COUNT(*) as c FROM job_descriptions')
                total_jobs = cursor.fetchone()['c']
                cursor.execute('SELECT COUNT(*) as c FROM resumes')
                total_resumes = cursor.fetchone()['c']
                cursor.execute("SELECT COUNT(*) as c FROM resumes WHERE processing_status = 'Completed'")
                ai_processed = cursor.fetchone()['c']
                cursor.execute("SELECT COALESCE(AVG(overall_score), 0) as a FROM candidate_scores")
                avg_score = int(cursor.fetchone()['a'])

                # 01_Report_Info
                info = [
                    ['Field', 'Value'],
                    ['System', 'ResumeIQ'],
                    ['Report Name', 'Complete Analytics & Reports Export'],
                    ['Generated Date', datetime.now().strftime('%Y-%m-%d')],
                    ['Generated Time', datetime.now().strftime('%H:%M:%S')],
                    ['Total Jobs', total_jobs],
                    ['Total Candidates', total_resumes],
                    ['Total AI Screenings', ai_processed],
                    ['Average AI Match Score', f"{avg_score}%"]
                ]
                writer.add_sheet('01_Report_Info', info)
                
                # 02_Dashboard_Summary
                dashboard = [
                    ['--- KPIs ---'],
                    ['Metric', 'Value'],
                    ['Total Jobs', total_jobs],
                    ['Total Candidates', total_resumes],
                    ['Total AI Screenings', ai_processed],
                    ['Average AI Match Score', f"{avg_score}%"],
                    [],
                    ['--- AI Recommendation Distribution ---'],
                    ['Recommendation', 'Count']
                ]
                cursor.execute("SELECT recommendation, COUNT(*) as c FROM candidate_scores GROUP BY recommendation")
                for row in cursor.fetchall():
                    dashboard.append([row['recommendation'], row['c']])
                writer.add_sheet('02_Dashboard_Summary', dashboard)

                # 03_Recruitment_Summary
                rec_summary = [['Job ID', 'Job Title', 'Company', 'Recruiter', 'Department', 'Employment Type', 'Location', 'Deadline', 'Vacancies', 'Uploaded', 'AI Processed', 'Failed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Avg AI Score', 'Avg Similarity']]
                cursor.execute('''
                    SELECT j.*, r.full_name as recruiter_name,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id) as uploaded,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND processing_status = 'Completed') as processed,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND processing_status = 'Failed') as failed,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.status = 'Shortlisted') as short,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.status = 'Waitlisted') as wait,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.status = 'Rejected') as rej,
                        (SELECT COALESCE(AVG(overall_score), 0) FROM candidate_scores s WHERE s.job_id = j.job_id) as avg_score,
                        (SELECT COALESCE(AVG(semantic_score), 0) FROM candidate_scores s WHERE s.job_id = j.job_id) as avg_sem
                    FROM job_descriptions j
                    LEFT JOIN recruiters r ON j.recruiter_id = r.recruiter_id
                ''')
                for row in cursor.fetchall():
                    rec_summary.append([row['job_id'], row['job_title'], row['company'], row['recruiter_name'], row['department'], row['employment_type'], row['location'], row['application_deadline'], row['vacancies'], row['uploaded'], row['processed'], row['failed'], row['short'], row['wait'], row['rej'], int(row['avg_score']), int(row['avg_sem'])])
                writer.add_sheet('03_Recruitment_Summary', rec_summary)

                # 04_Recruitment_Details
                rec_details = [['Job ID', 'Job Title', 'Candidate ID', 'Candidate Name', 'Recruiter', 'Resume ID', 'Resume File', 'AI Score', 'Semantic Score', 'Recommendation', 'Decision', 'Decision Date']]
                cursor.execute('''
                    SELECT res.job_id, j.job_title, c.candidate_id, c.full_name, r.full_name as recruiter, res.resume_id, res.file_name, cs.overall_score, cs.semantic_score, cs.recommendation, sel.status, sel.decision_date
                    FROM resumes res
                    LEFT JOIN job_descriptions j ON res.job_id = j.job_id
                    LEFT JOIN candidates c ON res.candidate_id = c.candidate_id
                    LEFT JOIN recruiters r ON res.recruiter_id = r.recruiter_id
                    LEFT JOIN candidate_scores cs ON res.resume_id = cs.resume_id
                    LEFT JOIN candidate_selection sel ON res.resume_id = sel.resume_id
                ''')
                for row in cursor.fetchall():
                    rec_details.append([row['job_id'], row['job_title'], row['candidate_id'], row['full_name'], row['recruiter'], row['resume_id'], row['file_name'], row['overall_score'], row['semantic_score'], row['recommendation'], row['status'], row['decision_date']])
                writer.add_sheet('04_Recruitment_Details', rec_details)

                # 05_Recruiter_Summary
                recru_summary = [['Recruiter ID', 'Recruiter Name', 'Company', 'Email', 'Jobs Created', 'Uploaded', 'AI Processed', 'Failed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Avg AI Score']]
                cursor.execute('''
                    SELECT r.recruiter_id, r.full_name, r.company, r.email,
                        (SELECT COUNT(*) FROM job_descriptions j WHERE j.recruiter_id = r.recruiter_id) as jobs,
                        (SELECT COUNT(*) FROM resumes res WHERE res.recruiter_id = r.recruiter_id) as uploaded,
                        (SELECT COUNT(*) FROM resumes res WHERE res.recruiter_id = r.recruiter_id AND processing_status = 'Completed') as processed,
                        (SELECT COUNT(*) FROM resumes res WHERE res.recruiter_id = r.recruiter_id AND processing_status = 'Failed') as failed,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.recruiter_id = r.recruiter_id AND cs.status = 'Shortlisted') as short,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.recruiter_id = r.recruiter_id AND cs.status = 'Waitlisted') as wait,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.recruiter_id = r.recruiter_id AND cs.status = 'Rejected') as rej,
                        (SELECT COALESCE(AVG(cs.overall_score), 0) FROM candidate_scores cs JOIN resumes res ON cs.resume_id = res.resume_id WHERE res.recruiter_id = r.recruiter_id) as avg_score
                    FROM recruiters r
                ''')
                for row in cursor.fetchall():
                    recru_summary.append([row['recruiter_id'], row['full_name'], row['company'], row['email'], row['jobs'], row['uploaded'], row['processed'], row['failed'], row['short'], row['wait'], row['rej'], int(row['avg_score'])])
                writer.add_sheet('05_Recruiter_Summary', recru_summary)

                # 06_Recruiter_Details
                recru_details = [['Recruiter', 'Job ID', 'Job Title', 'Uploaded', 'Processed', 'Failed', 'Shortlisted', 'Waitlisted', 'Rejected']]
                cursor.execute('''
                    SELECT r.full_name as recruiter, j.job_id, j.job_title,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND res.recruiter_id = r.recruiter_id) as uploaded,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND res.recruiter_id = r.recruiter_id AND processing_status = 'Completed') as processed,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND res.recruiter_id = r.recruiter_id AND processing_status = 'Failed') as failed,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.recruiter_id = r.recruiter_id AND cs.status = 'Shortlisted') as short,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.recruiter_id = r.recruiter_id AND cs.status = 'Waitlisted') as wait,
                        (SELECT COUNT(*) FROM candidate_selection cs WHERE cs.job_id = j.job_id AND cs.recruiter_id = r.recruiter_id AND cs.status = 'Rejected') as rej
                    FROM recruiters r
                    JOIN job_descriptions j ON r.recruiter_id = j.recruiter_id
                ''')
                for row in cursor.fetchall():
                    recru_details.append([row['recruiter'], row['job_id'], row['job_title'], row['uploaded'], row['processed'], row['failed'], row['short'], row['wait'], row['rej']])
                writer.add_sheet('06_Recruiter_Details', recru_details)

                # 07_AI_Summary
                ai_sum = [
                    ['--- AI KPIs ---'],
                    ['Total Resumes Processed', ai_processed],
                    ['Avg AI Score', f"{avg_score}%"]
                ]
                cursor.execute("SELECT COALESCE(AVG(semantic_score), 0) as s FROM candidate_scores")
                ai_sum.append(['Avg Semantic Similarity', f"{int(cursor.fetchone()['s'])}%"])
                writer.add_sheet('07_AI_Summary', ai_sum)

                # 08_AI_Job_Details
                ai_job = [['Job ID', 'Job Title', 'Uploaded', 'Processed', 'Failed', 'Highest Score', 'Lowest Score', 'Average AI Score']]
                cursor.execute('''
                    SELECT j.job_id, j.job_title,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id) as uploaded,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND processing_status = 'Completed') as processed,
                        (SELECT COUNT(*) FROM resumes res WHERE res.job_id = j.job_id AND processing_status = 'Failed') as failed,
                        (SELECT COALESCE(MAX(overall_score), 0) FROM candidate_scores cs WHERE cs.job_id = j.job_id) as highest,
                        (SELECT COALESCE(MIN(overall_score), 0) FROM candidate_scores cs WHERE cs.job_id = j.job_id) as lowest,
                        (SELECT COALESCE(AVG(overall_score), 0) FROM candidate_scores cs WHERE cs.job_id = j.job_id) as avg_score
                    FROM job_descriptions j
                ''')
                for row in cursor.fetchall():
                    ai_job.append([row['job_id'], row['job_title'], row['uploaded'], row['processed'], row['failed'], row['highest'], row['lowest'], int(row['avg_score'])])
                writer.add_sheet('08_AI_Job_Details', ai_job)

                # 09_Candidate_Evaluation
                cand_eval = [['Candidate ID', 'Candidate Name', 'Job ID', 'Job Title', 'Recruiter', 'Resume ID', 'Skills Score', 'Education Score', 'Experience Score', 'Semantic Score', 'Final Score', 'Recommendation', 'Evaluation Date']]
                cursor.execute('''
                    SELECT c.candidate_id, c.full_name, res.job_id, j.job_title, r.full_name as recruiter, res.resume_id, cs.skills_score, cs.education_score, cs.experience_score, cs.semantic_score, cs.overall_score, cs.recommendation, cs.created_at
                    FROM candidate_scores cs
                    JOIN resumes res ON cs.resume_id = res.resume_id
                    LEFT JOIN candidates c ON res.candidate_id = c.candidate_id
                    LEFT JOIN job_descriptions j ON res.job_id = j.job_id
                    LEFT JOIN recruiters r ON res.recruiter_id = r.recruiter_id
                ''')
                for row in cursor.fetchall():
                    cand_eval.append([row['candidate_id'], row['full_name'], row['job_id'], row['job_title'], row['recruiter'], row['resume_id'], row['skills_score'], row['education_score'], row['experience_score'], row['semantic_score'], row['overall_score'], row['recommendation'], row['created_at']])
                writer.add_sheet('09_Candidate_Evaluation', cand_eval)

                # 10_Resume_Processing
                res_proc = [['Resume ID', 'Candidate ID', 'Job ID', 'Recruiter', 'File Name', 'File Type', 'File Size', 'Upload Date', 'Status']]
                cursor.execute('''
                    SELECT res.resume_id, res.candidate_id, res.job_id, r.full_name as recruiter, res.file_name, res.file_type, res.file_size, res.upload_date, res.processing_status
                    FROM resumes res
                    LEFT JOIN recruiters r ON res.recruiter_id = r.recruiter_id
                ''')
                for row in cursor.fetchall():
                    res_proc.append([row['resume_id'], row['candidate_id'], row['job_id'], row['recruiter'], row['file_name'], row['file_type'], row['file_size'], row['upload_date'], row['processing_status']])
                writer.add_sheet('10_Resume_Processing', res_proc)

                # 11_Semantic_Scores
                sem_scores = [['Semantic ID', 'Resume ID', 'Candidate ID', 'Job Title', 'Semantic Similarity', 'Matched Keywords']]
                cursor.execute('''
                    SELECT s.semantic_id, s.resume_id, res.candidate_id, j.job_title, s.semantic_score, s.matched_keywords
                    FROM semantic_scores s
                    JOIN resumes res ON s.resume_id = res.resume_id
                    JOIN job_descriptions j ON res.job_id = j.job_id
                ''')
                for row in cursor.fetchall():
                    sem_scores.append([row.get('semantic_id', ''), row['resume_id'], row['candidate_id'], row['job_title'], row['semantic_score'], row['matched_keywords']])
                writer.add_sheet('11_Semantic_Scores', sem_scores)

                # 12_LinkedIn_Analysis
                li_ana = [['Resume ID', 'Candidate ID', 'LinkedIn URL', 'Profile Completeness', 'LinkedIn Score']]
                cursor.execute('''
                    SELECT l.resume_id, res.candidate_id, l.linkedin_url, l.profile_completeness, l.linkedin_score
                    FROM linkedin_analysis l
                    JOIN resumes res ON l.resume_id = res.resume_id
                ''')
                for row in cursor.fetchall():
                    li_ana.append([row['resume_id'], row['candidate_id'], row['linkedin_url'], row['profile_completeness'], row['linkedin_score']])
                writer.add_sheet('12_LinkedIn_Analysis', li_ana)

                # 13_Portfolio_Analysis
                port_ana = [['Resume ID', 'Candidate ID', 'Portfolio URL', 'Portfolio Score', 'Analysis Summary']]
                cursor.execute('''
                    SELECT p.resume_id, res.candidate_id, p.portfolio_url, p.portfolio_score, p.analysis_summary
                    FROM portfolio_analysis p
                    JOIN resumes res ON p.resume_id = res.resume_id
                ''')
                for row in cursor.fetchall():
                    port_ana.append([row['resume_id'], row['candidate_id'], row['portfolio_url'], row['portfolio_score'], row['analysis_summary']])
                writer.add_sheet('13_Portfolio_Analysis', port_ana)

                # 14_Candidate_Decisions
                decisions = [['Selection ID', 'Candidate ID', 'Candidate Name', 'Job Title', 'Recruiter', 'Decision', 'Decision Date']]
                cursor.execute('''
                    SELECT sel.selection_id, c.candidate_id, c.full_name, j.job_title, r.full_name as recruiter, sel.status, sel.decision_date
                    FROM candidate_selection sel
                    JOIN candidates c ON sel.candidate_id = c.candidate_id
                    JOIN job_descriptions j ON sel.job_id = j.job_id
                    JOIN recruiters r ON sel.recruiter_id = r.recruiter_id
                ''')
                for row in cursor.fetchall():
                    decisions.append([row['selection_id'], row['candidate_id'], row['full_name'], row['job_title'], row['recruiter'], row['status'], row['decision_date']])
                writer.add_sheet('14_Candidate_Decisions', decisions)

                # 15_Activity_Logs
                logs = [['Log ID', 'User ID', 'Action', 'Module', 'Description', 'Timestamp']]
                cursor.execute('''
                    SELECT log_id, user_id, action, module, description, created_at
                    FROM activity_logs
                    ORDER BY created_at DESC
                ''')
                for row in cursor.fetchall():
                    logs.append([row['log_id'], row['user_id'], row['action'], row['module'], row['description'], row['created_at']])
                writer.add_sheet('15_Activity_Logs', logs)
                
        finally:
            conn.close()
            
        return writer.save()

reports_xlsx_service = ReportsXLSXService()
