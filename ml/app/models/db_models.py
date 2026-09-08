"""SQLAlchemy models matching the master database schema (read-only for ML)."""

from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    mobile = Column(String)
    role = Column(String)
    address = Column(Text, nullable=True)
    district = Column(String, nullable=True)
    village = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    tokens = relationship("Token", back_populates="farmer")


class ProcurementCenter(Base):
    __tablename__ = "procurement_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    district = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    daily_capacity = Column(Integer)
    status = Column(String, default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    slots = relationship("Slot", back_populates="center")
    tokens = relationship("Token", back_populates="center")


class Slot(Base):
    __tablename__ = "slots"

    id = Column(Integer, primary_key=True, index=True)
    center_id = Column(Integer, ForeignKey("procurement_centers.id"))
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    capacity = Column(Integer)
    available_slots = Column(Integer)
    status = Column(String, default="active")

    center = relationship("ProcurementCenter", back_populates="slots")
    tokens = relationship("Token", back_populates="slot")


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(String)
    farmer_id = Column(Integer, ForeignKey("users.id"))
    center_id = Column(Integer, ForeignKey("procurement_centers.id"))
    slot_id = Column(Integer, ForeignKey("slots.id"))
    status = Column(String)
    queue_position = Column(Integer, nullable=True)
    estimated_wait_time = Column(Integer, nullable=True)  # minutes
    booked_at = Column(DateTime)
    called_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    farmer = relationship("User", back_populates="tokens")
    center = relationship("ProcurementCenter", back_populates="tokens")
    slot = relationship("Slot", back_populates="tokens")
    procurement = relationship("Procurement", back_populates="token", uselist=False)


class Procurement(Base):
    __tablename__ = "procurement"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(Integer, ForeignKey("tokens.id"))
    farmer_id = Column(Integer, ForeignKey("users.id"))
    center_id = Column(Integer, ForeignKey("procurement_centers.id"))
    commodity = Column(String)
    quantity = Column(Float)
    quality_status = Column(String)
    procurement_status = Column(String)
    payment_status = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    token = relationship("Token", back_populates="procurement")
