class InvalidResumeFile(Exception):
    pass

class JobNotFound(Exception):
    pass

class UnauthorizedJobAccess(Exception):
    pass

class ResumeParsingError(Exception):
    pass

class CandidateCreationError(Exception):
    pass

class AIProcessingError(Exception):
    pass

class CorruptedDocumentError(Exception):
    """Raised when a file cannot be opened by PyMuPDF or python-docx."""
    pass

class EmptyDocumentError(Exception):
    """Raised when a file opens successfully but contains no meaningful text."""
    pass
