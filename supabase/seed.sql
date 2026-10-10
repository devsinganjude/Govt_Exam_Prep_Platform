-- 1 exam: MPSC Combined Prelims
insert into exams (id, name, total_marks, marks_per_question, negative_marking)
values ('11111111-1111-1111-1111-111111111111', 'MPSC Combined Prelims', 100, 2, 0.25)
on conflict do nothing;

-- Subjects
insert into subjects (id, exam_id, name, sort_order) values
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'History', 1),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Geography', 2),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Polity', 3),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Economy', 4),
('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'Science and Technology', 5),
('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111111', 'Environment', 6),
('22222222-2222-2222-2222-222222222227', '11111111-1111-1111-1111-111111111111', 'Current Affairs', 7),
('22222222-2222-2222-2222-222222222228', '11111111-1111-1111-1111-111111111111', 'CSAT', 8)
on conflict do nothing;

-- Topics for Polity
insert into topics (id, subject_id, name, sort_order) values
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222223', 'Constitution Basics', 1),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222223', 'Fundamental Rights', 2),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', 'Parliament', 3),
('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222223', 'Local Self Government', 4)
on conflict do nothing;

-- Questions
insert into questions (id, topic_id, question_text, options, correct_option, explanation, difficulty, source, verified) values
(gen_random_uuid(), '33333333-3333-3333-3333-333333333332', 'Which part of the Constitution deals with Fundamental Rights?', '["Part I", "Part II", "Part III", "Part IV"]', 2, 'Part III of the Constitution (Articles 12-35) deals with Fundamental Rights.', 'easy', 'placeholder', false),
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'Who is the ex-officio chairman of the Rajya Sabha?', '["President", "Vice-President", "Prime Minister", "Chief Justice of India"]', 1, 'The Vice-President of India is the ex-officio chairman of the Rajya Sabha.', 'easy', 'placeholder', false)
on conflict do nothing;
