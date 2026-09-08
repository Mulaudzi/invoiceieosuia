ALTER TABLE invoices
    MODIFY COLUMN status ENUM('Draft','Pending','Sent','Partially Paid','Paid','Overdue','Cancelled') DEFAULT 'Draft';
