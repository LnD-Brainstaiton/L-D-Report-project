from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    department = Column(String, nullable=False)  # Changed from sbu enum to department string
    designation = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    career_start_date = Column(Date, nullable=True)  # For calculating total experience
    bs_joining_date = Column(Date, nullable=True)  # For calculating BS experience
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Student(id={self.id}, employee_id={self.employee_id}, name={self.name})>"

