-- Update Full Stack business color from #10b981 to #00b495
-- This color change is to reflect a new teal branding for the Full Stack area

UPDATE businesses
SET color = '#00b495'
WHERE name = 'Full Stack' OR slug = 'full-stack';
