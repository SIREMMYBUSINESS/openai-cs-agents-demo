/*
  # Seed Sample Data for Federated Learning Consent Management

  1. Sample Data
    - Insert sample hospitals
    - Insert sample research projects
    - Insert sample admin user profile
*/

-- Insert sample hospitals
INSERT INTO hospitals (name, address, contact_email) VALUES
  ('General Hospital', '123 Medical Center Dr, Healthcare City, HC 12345', 'admin@generalhospital.com'),
  ('University Medical Center', '456 Research Blvd, University Town, UT 67890', 'research@umc.edu'),
  ('Regional Health System', '789 Community Ave, Regional City, RC 54321', 'info@regionalhealthsystem.org')
ON CONFLICT DO NOTHING;

-- Insert sample research projects
INSERT INTO research_projects (
  title, 
  description, 
  principal_investigator, 
  institution, 
  data_types, 
  purpose, 
  duration_months, 
  status
) VALUES
  (
    'AI-Powered Diagnostic Imaging for Early Cancer Detection',
    'This research project aims to develop and validate artificial intelligence algorithms for early detection of various cancers using medical imaging data. The federated learning approach ensures patient privacy while enabling collaborative model training across multiple healthcare institutions.',
    'Dr. Sarah Johnson, MD, PhD',
    'University Medical Center',
    ARRAY['Medical Images', 'Diagnostic Reports', 'Patient Demographics', 'Treatment Outcomes'],
    'To improve early cancer detection rates and reduce false positives in diagnostic imaging through advanced AI algorithms trained on diverse, multi-institutional datasets.',
    36,
    'active'
  ),
  (
    'Federated Learning for Personalized Treatment Recommendations',
    'A collaborative research initiative to develop personalized treatment recommendation systems using federated learning techniques. This project focuses on cardiovascular diseases and aims to improve treatment outcomes while maintaining patient data privacy.',
    'Prof. Michael Chen, PhD',
    'General Hospital Research Institute',
    ARRAY['Electronic Health Records', 'Lab Results', 'Medication History', 'Treatment Responses'],
    'To create personalized treatment recommendation algorithms that can adapt to individual patient characteristics and improve cardiovascular disease outcomes.',
    24,
    'active'
  ),
  (
    'Privacy-Preserving Mental Health Analytics',
    'This study explores the use of federated learning for mental health analytics, focusing on depression and anxiety disorders. The research aims to identify patterns and risk factors while ensuring complete patient privacy and data security.',
    'Dr. Emily Rodriguez, PhD',
    'Regional Health System',
    ARRAY['Mental Health Assessments', 'Behavioral Data', 'Treatment History', 'Outcome Measures'],
    'To develop predictive models for mental health outcomes and treatment effectiveness while maintaining strict privacy standards.',
    18,
    'active'
  ),
  (
    'Collaborative Drug Discovery Through Federated Learning',
    'A multi-institutional research project focused on accelerating drug discovery processes using federated learning approaches. This study aims to identify potential drug candidates and predict their efficacy across diverse patient populations.',
    'Dr. Robert Kim, PharmD, PhD',
    'University Medical Center',
    ARRAY['Genomic Data', 'Drug Response Data', 'Clinical Trial Results', 'Biomarker Information'],
    'To accelerate drug discovery and development by leveraging collaborative machine learning while protecting sensitive patient and proprietary data.',
    48,
    'active'
  )
ON CONFLICT DO NOTHING;