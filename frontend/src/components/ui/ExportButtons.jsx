import React from 'react';
import { FiDownload, FiFileText, FiPrinter } from 'react-icons/fi';

const ExportButtons = ({ data = [], filename = 'export' }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header];
        // Convert objects/arrays to string representation
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        else if (val === null || val === undefined) val = '';
        
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return;
    }
    
    let tableHtml = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>';
    const headers = Object.keys(data[0]);
    headers.forEach(h => tableHtml += `<th>${h}</th>`);
    tableHtml += '</tr></thead><tbody>';
    
    data.forEach(row => {
      tableHtml += '<tr>';
      headers.forEach(h => {
        let val = row[h];
        if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
        else if (val === null || val === undefined) val = '';
        tableHtml += `<td>${val}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></body></html>';
    
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
        <FiDownload className="w-3.5 h-3.5" /> CSV
      </button>
      <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
        <FiFileText className="w-3.5 h-3.5" /> Excel
      </button>
      <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-gray-800 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:border-gray-600 transition-colors">
        <FiPrinter className="w-3.5 h-3.5" /> Print
      </button>
    </div>
  );
};

export default ExportButtons;
