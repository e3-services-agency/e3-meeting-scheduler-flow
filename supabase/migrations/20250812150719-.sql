-- Update business hours to more reasonable working hours
UPDATE business_hours 
SET 
  monday_start = '09:00:00',
  monday_end = '17:00:00',
  tuesday_start = '09:00:00', 
  tuesday_end = '17:00:00',
  wednesday_start = '09:00:00',
  wednesday_end = '17:00:00', 
  thursday_start = '09:00:00',
  thursday_end = '17:00:00',
  friday_start = '09:00:00',
  friday_end = '17:00:00',
  updated_at = now()
WHERE is_active = true;