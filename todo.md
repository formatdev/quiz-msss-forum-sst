# Client Feedback TODO - Question-Based

Only questions/comments explicitly mentioned by the client are included below.
If a question number is not listed as a rework item, it is considered OK (no change).

## q-000 - Global text update
- [x] Replace ministry name in UI text resources:
  - from: `Ministere de la Sante`
  - to: `Ministere de la Sante et de la Securite Sociale`
- [x] Target file:
  - `frontend/src/i18n/index.ts`

## q-001 - Multi-answer exact selection + related behavior
- [x] Introduce new question type: `multiple_exact`.
- [x] Rule: user must select exactly the number of answers defined in `correctAnswers`.
- [x] For q-001 (`correctAnswers` has 2 items), submit only when exactly 2 are selected.
- [x] Backend must reject invalid selection count for `multiple_exact`.
- [x] Apply `multiple_exact` to q-001 in seed data.
- [x] Update seed validation/type definitions/DB type check to support `multiple_exact`.
- [x] Adjust feedback visual behavior: partial result must not trigger full winner mascot/state.

## q-005 - Remove "all of the above" and require all correct choices
- [x] Remove answer `D` ("Toutes les reponses ci-dessus" / "Alle oben genannten Antworten" / "All of the above") from q-005 in FR/DE/EN.
- [x] Change q-005 type to `multiple_exact`.
- [x] Set q-005 `correctAnswers` to all remaining valid choices (`A`, `B`, `C`).
- [x] Acceptance:
  - q-005 can only be submitted when exactly 3 answers are selected.
  - full success only when `A+B+C` are selected.

## q-006 and q-017 - Single selection but both answers accepted
- [x] Keep both questions as "Any" correctness (`"correctAnswers": ["Any"]`).
- [x] Change both question types to `single` so only one choice can be selected.
- [x] Acceptance:
  - user can click only one option
  - either option is accepted as correct

### q-006 image prompt
- [x] Replace q-006 image with a new version aligned to client request.
- [x] Prompt:
  - `Create a vertical 2:3 cartoon illustration (1024x1536) in the same visual style as the existing quiz assets. Theme: alcohol and tobacco related health risk awareness, with educational pictograms linked to the question. Include clear symbols for alcohol and tobacco, and a simple body silhouette highlighting relevant risk zones. Keep it clean, positive, and kiosk-friendly. No text, no logo, no watermark.`

## q-009 - Translation update + image update
- [x] Update EN question text:
  - `Does the Labour Code in Luxembourg provide for breastfeeding breaks?`
- [x] Update DE question text:
  - `Sieht das Arbeitsgesetzbuch in Luxemburg Stillpausen vor?`
- [x] Update EN explanation:
  - `According to Article L.336-3 of the Labour Code: at the request of the breastfeeding employee, the employer must grant breastfeeding time during the working day (2 x 45 minutes for full-time work). This time is counted as actual working time and is paid normally.`
- [x] Update DE explanation:
  - `GemaB Artikel L.336-3 des Arbeitsgesetzbuches: Auf Antrag der stillenden Arbeitnehmerin muss der Arbeitgeber wahrend des Arbeitstages Stillzeiten gewahren (2 x 45 Minuten bei Vollzeitbeschaftigung). Diese Zeit gilt als tatsachliche Arbeitszeit und wird normal vergutet.`
- [x] Target file:
  - `data/questions.seed.json`

### q-009 image prompt (female mascot + clock + biberon)
- [x] Prompt:
  - `Create a vertical 2:3 illustration (1024x1536), same style as the current quiz mascot images (clean cartoon, soft blue gradient background, bright colors, high readability). Use a FEMALE superhero mascot version consistent with the current character design language. Scene: mascot next to a simple round clock icon. Replace the heart icon with a baby bottle (biberon) icon. Keep only 2-3 main elements (mascot, clock, biberon). No text, no logos, no watermark.`

## q-010 - Image update (icons aligned to question)
### q-010 image prompt
- [x] Approved prompt:
  - `Create a vertical 2:3 cartoon illustration in the same quiz style with a FEMALE superhero mascot. Theme: collaboration with community-based mental health services for companies. Show simple symbols for workplace, confidential support/referral pathway, and local support network (for example connected nodes, helping hand, guidance arrow). Keep it clear, supportive, and professional. No text, no logos, no watermark.`

## q-011 - German wording update + addiction image update
- [x] In DE translation for q-011, replace `Gesundheitsfachkrafte/Gesundheitsfachpersonen` with `Gesundheitspersonal` where relevant (choices + explanation).
- [x] Target file:
  - `data/questions.seed.json`

### q-011 image prompt (addictions)
- [x] Prompt:
  - `Create a vertical 2:3 cartoon illustration in the same quiz style, with a FEMALE superhero mascot. Theme: addiction prevention in the workplace. Include clear icons for tobacco, alcohol, gaming, and drugs (pill/capsule symbol), plus a supportive referral/help concept. Keep tone preventive and supportive (not punitive). No text, no logos, no watermark.`

## q-013 - Explanation text update (FR/DE/EN)
- [x] Replace q-013 explanations with client-provided longer versions:
  - FR: `Les medicaments aident selon la cause (infection, inflammation, surdite brusque, maladie de Meniere) ou en cas d anxiete et d insomnie. Les generateurs de bruit reduisent la perception en le masquant. Les therapies psychologiques favorisent l acceptation et diminuent ainsi l intensite percue.`
  - DE: `Medikamente helfen je nach Ursache (Infektion, Entzundung, Horsturz, Morbus Meniere) oder bei Angst und Schlafproblemen. Gerauschgeneratoren mindern die Wahrnehmung durch Uberdecken. Psychologische Therapien fordern Akzeptanz und Toleranz und senken so die empfundene Intensitat.`
  - EN: `Medication helps depending on the cause (infection, inflammation, sudden hearing loss, Meniere s disease) or for anxiety and insomnia. Noise generators reduce perception by masking the sound. Psychological therapies support acceptance and tolerance, lowering the perceived intensity.`

## q-014 - Explanation text update + image update
- [x] Replace q-014 explanations with client-provided longer versions:
  - FR: `Une exposition reguliere a 60 dB (conversation normale, bureau anime) maintient le corps en alerte, augmentant stress, tension et fatigue. Ceci peut perturber le sommeil, la concentration et la sante cardiovasculaire. A 85 dB, l audition est directement affectee.`
  - DE: `RegelmaBige Larmbelastung von 60 dB (normales Gesprach, belebtes Buro) halt den Korper in Alarmbereitschaft, erhoht Stress, Blutdruck und Mudigkeit. Dies kann Schlaf, Konzentration und Herz-Kreislauf-Gesundheit beeintrachtigen. Ab 85 dB wird das Gehor direkt geschadigt.`
  - EN: `Regular exposure to 60 dB (normal conversation, busy office) keeps the body alert, increasing stress, blood pressure, and fatigue. This can affect sleep, concentration, and cardiovascular health. At 85 dB, hearing is directly impacted.`

### q-014 image prompt
- [x] Prompt:
  - `Create a vertical 2:3 cartoon illustration in the same quiz style with a FEMALE superhero mascot. Theme: health impact of noise exposure. Show a decibel meter with 60 dB and 85 dB as key levels, and subtle visual cues for stress/fatigue plus hearing risk. Educational and clean composition. No text labels except numeric dB if needed, no logos, no watermark.`

## q-016 - German answer wording update
- [x] Update DE answer wording in q-016 to:
  - `Eine pflanzenbasierte Ernahrung mit wenig Salz und Zucker wahlen.`
- [x] Target file:
  - `data/questions.seed.json`

## q-090 - Explicitly no rework
- [x] No changes for these question IDs (no client comment):
  - `q-002, q-003, q-004, q-007, q-008, q-012, q-015`

## q-099 - Apply and verify
- [x] Reseed:
  - `POST /api/admin/initialize`
- [x] Validate behavior:
  - q-001 exact multi-select
  - q-005 exact multi-select without "all of the above"
  - q-006/q-017 single-select with Any correctness
  - q-009 translation updates
  - q-010 updated image matches question intent
  - q-011 DE terminology update
  - q-013/q-014 longer explanations
  - q-016 DE wording update
- [x] Run checks:
  - `npm run lint`
  - `npm test`
