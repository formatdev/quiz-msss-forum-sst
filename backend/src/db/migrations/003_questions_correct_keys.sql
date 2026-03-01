ALTER TABLE questions
ADD COLUMN correct_option_keys_json TEXT NOT NULL DEFAULT '[]';
