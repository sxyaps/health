/**
 * HealthPulse - UI Module
 * Handles all translations, screen management, and reusable UI components.
 * Provides a complete bilingual text system (English and Dutch).
 */
window.HealthUI = (function () {
  'use strict';

  /** Complete translations object for all UI text in both languages */
  var TRANSLATIONS = {
    en: {
      /* App Identity */
      app_name: 'HealthPulse',

      /* Onboarding */
      onboarding_title: 'Welcome to HealthPulse',
      onboarding_subtitle: 'Your private daily health companion',
      onboarding_pick_lang: 'Choose your language to get started',
      btn_english: 'English',
      btn_dutch: 'Nederlands',

      /* Navigation */
      nav_home: 'Home',
      nav_checkin: 'Check-in',
      nav_mind: 'Mind',
      nav_insights: 'Insights',
      nav_chat: 'Chat',

      /* Header */
      header_settings: 'Settings',

      /* Dashboard */
      dashboard_greeting_morning: 'Good morning',
      dashboard_greeting_afternoon: 'Good afternoon',
      dashboard_greeting_evening: 'Good evening',
      dashboard_checkin_done: 'Check-in complete for today!',
      dashboard_checkin_pending: "You haven't checked in today",
      dashboard_btn_checkin: 'Start Check-in',
      dashboard_btn_update: 'Update Check-in',
      dashboard_streak: 'Day streak',
      dashboard_total: 'Total check-ins',
      dashboard_avg_mood: 'Avg mood',
      dashboard_week_overview: 'This Week',
      dashboard_metrics_title: 'Quick Metrics',
      dashboard_recent: 'Recent Entries',
      dashboard_no_entries: 'No entries yet. Start your first check-in!',

      /* Check-in Flow */
      checkin_title: 'Daily Check-in',
      checkin_step: 'Step',
      checkin_of: 'of',
      checkin_mood: 'How is your mood today?',
      checkin_physical: 'How is your physical condition?',
      checkin_sleep: 'How was your sleep last night?',
      checkin_nutrition: 'How was your nutrition today?',
      checkin_stress: 'What is your stress level?',
      checkin_symptoms: 'Any symptoms or notes?',
      checkin_symptoms_placeholder: 'Describe any symptoms or how you feel...',
      checkin_next: 'Next',
      checkin_prev: 'Back',
      checkin_submit: 'Save Check-in',
      checkin_success: 'Check-in saved successfully!',
      checkin_cancel: 'Cancel',

      /* Scale Labels */
      mood_1: 'Very Bad',
      mood_2: 'Bad',
      mood_3: 'Okay',
      mood_4: 'Good',
      mood_5: 'Great',
      physical_1: 'Very Poor',
      physical_2: 'Poor',
      physical_3: 'Average',
      physical_4: 'Good',
      physical_5: 'Excellent',
      sleep_1: 'Terrible',
      sleep_2: 'Poor',
      sleep_3: 'Fair',
      sleep_4: 'Good',
      sleep_5: 'Excellent',
      nutrition_1: 'Very Poor',
      nutrition_2: 'Poor',
      nutrition_3: 'Average',
      nutrition_4: 'Good',
      nutrition_5: 'Excellent',
      stress_1: 'Minimal',
      stress_2: 'Low',
      stress_3: 'Moderate',
      stress_4: 'High',
      stress_5: 'Extreme',

      /* Mood Emojis */
      mood_emoji_1: '\uD83D\uDE22',
      mood_emoji_2: '\uD83D\uDE15',
      mood_emoji_3: '\uD83D\uDE10',
      mood_emoji_4: '\uD83D\uDE0A',
      mood_emoji_5: '\uD83D\uDE04',

      /* Metrics */
      metrics_weight: 'Weight (kg)',
      metrics_sleep_hours: 'Sleep hours',
      metrics_workout: 'Workout (min)',
      metrics_save: 'Save Metrics',
      metrics_saved: 'Metrics saved!',

      /* Insights */
      insights_title: 'Insights',
      insights_need_more: 'Complete at least 7 check-ins to unlock insights.',
      insights_checkins_count: 'check-ins so far',
      insights_trends: 'Trends',
      insights_advice: 'Personalized Advice',
      insights_patterns: 'Patterns',
      insights_reports: 'Monthly Report',
      insights_improving: 'Improving',
      insights_declining: 'Declining',
      insights_stable: 'Stable',
      insights_avg: 'avg',

      /* Mental Health */
      mind_title: 'Mind',
      mind_breathing_title: 'Breathing Exercise',
      mind_breathing_desc: 'Calm your nervous system with 4-7-8 breathing',
      mind_breathing_start: 'Start Breathing',
      mind_breathing_stop: 'Stop',
      mind_breathe_in: 'Breathe In...',
      mind_hold: 'Hold...',
      mind_breathe_out: 'Breathe Out...',
      mind_get_ready: 'Get Ready...',
      mind_journal_title: 'Safe Space Journal',
      mind_journal_desc: 'Write whatever is on your mind. Nobody sees this but you.',
      mind_journal_placeholder: 'let it all out... this is just for you',
      mind_journal_save: 'Save Entry',
      mind_journal_saved: 'Journal entry saved',
      mind_journal_history: 'Past Entries',
      mind_grounding_title: '5-4-3-2-1 Grounding',
      mind_grounding_desc: 'When anxiety hits, ground yourself with your senses',
      mind_grounding_5: '5 things you can SEE',
      mind_grounding_4: '4 things you can TOUCH',
      mind_grounding_3: '3 things you can HEAR',
      mind_grounding_2: '2 things you can SMELL',
      mind_grounding_1: '1 thing you can TASTE',
      mind_grounding_start: 'Start Exercise',
      mind_grounding_next: 'Next',
      mind_grounding_done: 'Done! You are here. You are safe.',
      mind_affirmation_title: 'Daily Affirmation',
      mind_crisis_title: 'Need Help Right Now?',
      mind_crisis_desc: 'If you are in crisis, please reach out:',
      mind_crisis_line1: '988 Suicide & Crisis Lifeline',
      mind_crisis_line1_num: 'Call or text 988',
      mind_crisis_line2: 'Crisis Text Line',
      mind_crisis_line2_num: 'Text HOME to 741741',
      mind_crisis_line3: '113 Zelfmoordpreventie (NL)',
      mind_crisis_line3_num: 'Bel 113 of 0800-0113',
      mind_sos_btn: 'Talk to Someone Now',

      /* Ambient Sounds */
      mind_sounds_title: 'Ambient Sound',
      mind_sound_rain: 'Rain',
      mind_sound_ocean: 'Ocean',
      mind_sound_forest: 'Forest',
      mind_sound_off: 'Off',
      mind_sound_volume: 'Volume',

      /* Chat */
      chat_title: 'Chat',
      chat_placeholder: 'talk to me about anything...',
      chat_welcome: "hey, whats up. you can talk to me about whatever - how you're feeling, your mood, sleep, stress, or just vent. i can also pull up your health data if you want. no judgment",
      chat_send: 'Send',

      /* Reports */
      reports_title: 'Monthly Report',
      reports_need_more: 'Complete at least 30 days of check-ins to generate a full report.',
      reports_days_count: 'days of data so far',
      reports_generate: 'Generate Report',
      reports_habits: 'Habits Summary',
      reports_improvements: 'Improvements',
      reports_warnings: 'Warnings',
      reports_suggestions: 'Suggestions',

      /* Settings */
      settings_title: 'Settings',
      settings_appearance: 'Appearance',
      settings_theme: 'Theme',
      settings_theme_light: 'Light',
      settings_theme_dark: 'Dark',
      settings_accent: 'Accent Color',
      settings_sounds: 'Sound Effects',
      settings_language: 'Language',
      settings_reminders: 'Daily Reminders',
      settings_reminder_time: 'Reminder Time',
      settings_reminder_enabled: 'Reminders enabled',
      settings_reminder_disabled: 'Reminders disabled',
      settings_export: 'Export Data',
      settings_export_desc: 'Download all your data as JSON',
      settings_clear: 'Clear All Data',
      settings_clear_desc: 'Permanently delete all stored data',
      settings_clear_confirm: 'Are you sure you want to delete all data? This cannot be undone.',
      settings_cleared: 'All data cleared.',
      settings_about: 'About HealthPulse',
      settings_about_text: 'A privacy-first health tracking PWA. All data stays on your device.',
      settings_version: 'Version 1.0.0',
      settings_back: 'Back',

      /* Notifications */
      notification_title: 'HealthPulse Reminder',
      notification_body: 'Time for your daily health check-in!',
      notification_permission_denied: 'Notification permission denied. Enable it in your browser settings.',

      /* General */
      btn_save: 'Save',
      btn_cancel: 'Cancel',
      btn_close: 'Close',
      loading: 'Loading...',
      no_data: 'No data yet',
      today: 'Today',
      yesterday: 'Yesterday',

      /* Gamification */
      wellness_score: 'Wellness Score',
      wellness_excellent: 'Excellent',
      wellness_good: 'Good',
      wellness_fair: 'Fair',
      wellness_poor: 'Needs work',
      wellness_no_data: 'Check in to see your score',

      level_title: 'Level',
      level_1: 'Beginner',
      level_2: 'Regular',
      level_3: 'Dedicated',
      level_4: 'Committed',
      level_5: 'Veteran',
      level_6: 'Master',
      xp_label: 'XP',
      xp_to_next: 'to next level',
      xp_max: 'Max level reached!',

      achievements_title: 'Achievements',
      achievements_locked: 'Keep going to unlock!',
      achievement_first_checkin: 'First Check-in',
      achievement_streak_3: '3-Day Streak',
      achievement_streak_7: 'Week Warrior',
      achievement_streak_14: 'Two-Week Hero',
      achievement_streak_30: 'Monthly Legend',
      achievement_total_10: 'Ten Strong',
      achievement_total_50: 'Half Century',
      achievement_total_100: 'Centurion',
      achievement_metrics_7: 'Metrics Pro',
      achievement_low_stress: 'Zen Master',
      achievement_good_sleep: 'Dream Chaser',
      achievement_happy_week: 'Happy Camper',

      daily_quote: 'Daily Motivation',
      mood_this_week: 'Your Week',
      mood_no_week_data: 'Check in daily to see your week',

      celebration_title: 'Check-in Complete!',
      celebration_xp_earned: 'XP earned',
      celebration_streak: 'day streak!',
      celebration_new_badge: 'New Achievement Unlocked!',
      celebration_continue: 'Continue',
      celebration_great: 'Great job!',
      celebration_keep_going: 'Keep up the momentum!',
      celebration_first: 'Your journey begins!',

      /* Pet */
      pet_name: 'Pulse',
      pet_happy: 'Happy & Healthy',
      pet_good: 'Feeling Good',
      pet_neutral: 'Doing Okay',
      pet_sad: 'Needs Care',
      pet_stressed: 'Feeling Tense',
      pet_sleepy: 'Waiting for you...',
      pet_tap_hint: 'Tap me for a tip!',

      /* Daily Quests */
      quests_title: 'Daily Quests',
      quests_bonus: 'bonus XP',
      quests_all_done: 'All quests done!',
      q_checkin: 'Complete your daily check-in',
      q_mood_4: 'Rate your mood Good or higher',
      q_sleep_4: 'Rate your sleep Good or higher',
      q_stress_low: 'Keep stress at Low or less',
      q_nutrition_4: 'Rate nutrition Good or higher',
      q_physical_4: 'Rate physical condition Good+',
      q_log_weight: 'Log your weight today',
      q_workout_20: 'Log 20+ minutes of exercise',
      q_sleep_7h: 'Log 7+ hours of sleep',
      q_log_symptoms: 'Write down your symptoms',

      /* Streak Multiplier */
      multiplier_label: 'XP Boost',
      multiplier_hint: '3-day streak to unlock!',

      /* Weekly Challenges */
      wc_title: 'Weekly Challenge',
      wc_progress: 'Progress',
      wc_completed: 'Challenge Complete!',
      wc_walk_10: 'Walk or exercise 10+ min for 5 days',
      wc_journal_3: 'Write in your journal 3 times',
      wc_mood_4_three: 'Rate your mood Good+ for 3 days',
      wc_log_metrics_5: 'Log metrics for 5 days',
      wc_checkin_every_day: 'Check in every day this week',
      wc_low_stress_3: 'Keep stress Low for 3 days',
      wc_sleep_good_4: 'Rate sleep Good+ for 4 days',
      wc_nutrition_4_three: 'Rate nutrition Good+ for 3 days',
      wc_workout_30_three: 'Work out 30+ min for 3 days',
      wc_sleep_7h_5: 'Sleep 7+ hours for 5 days',

      /* Medication Reminders */
      meds_title: 'Medications',
      meds_add: 'Add Medication',
      meds_name: 'Medication name',
      meds_dose: 'Dose',
      meds_time: 'Time',
      meds_taken: 'taken',
      meds_empty: 'No medications added yet',
      meds_all_taken: 'All taken!',
      meds_save: 'Save',
      meds_delete_confirm: 'Remove this medication?',
      meds_added: 'Medication added!',

      /* Sleep Score */
      sleep_score_title: 'Sleep Score',
      sleep_score_quality: 'Quality',
      sleep_score_hours: 'Hours',

      /* Export PDF */
      reports_export_pdf: 'Download as PDF',
      reports_pdf_title: 'HealthPulse Monthly Report',

      /* Days of week (short) */
      day_mon: 'Mon',
      day_tue: 'Tue',
      day_wed: 'Wed',
      day_thu: 'Thu',
      day_fri: 'Fri',
      day_sat: 'Sat',
      day_sun: 'Sun'
    },

    nl: {
      /* App Identity */
      app_name: 'HealthPulse',

      /* Onboarding */
      onboarding_title: 'Welkom bij HealthPulse',
      onboarding_subtitle: 'Je privé dagelijkse gezondheidspartner',
      onboarding_pick_lang: 'Kies je taal om te beginnen',
      btn_english: 'English',
      btn_dutch: 'Nederlands',

      /* Navigation */
      nav_home: 'Home',
      nav_checkin: 'Check-in',
      nav_mind: 'Mind',
      nav_insights: 'Inzichten',
      nav_chat: 'Chat',

      /* Header */
      header_settings: 'Instellingen',

      /* Dashboard */
      dashboard_greeting_morning: 'Goedemorgen',
      dashboard_greeting_afternoon: 'Goedemiddag',
      dashboard_greeting_evening: 'Goedenavond',
      dashboard_checkin_done: 'Check-in voor vandaag voltooid!',
      dashboard_checkin_pending: 'Je hebt vandaag nog niet ingecheckt',
      dashboard_btn_checkin: 'Start Check-in',
      dashboard_btn_update: 'Check-in Bijwerken',
      dashboard_streak: 'Dagen streak',
      dashboard_total: 'Totaal check-ins',
      dashboard_avg_mood: 'Gem. stemming',
      dashboard_week_overview: 'Deze Week',
      dashboard_metrics_title: 'Snelle Metingen',
      dashboard_recent: 'Recente Invoeren',
      dashboard_no_entries: 'Nog geen invoeren. Start je eerste check-in!',

      /* Check-in Flow */
      checkin_title: 'Dagelijkse Check-in',
      checkin_step: 'Stap',
      checkin_of: 'van',
      checkin_mood: 'Hoe is je stemming vandaag?',
      checkin_physical: 'Hoe is je fysieke conditie?',
      checkin_sleep: 'Hoe was je slaap afgelopen nacht?',
      checkin_nutrition: 'Hoe was je voeding vandaag?',
      checkin_stress: 'Wat is je stressniveau?',
      checkin_symptoms: 'Klachten of opmerkingen?',
      checkin_symptoms_placeholder: 'Beschrijf eventuele symptomen of hoe je je voelt...',
      checkin_next: 'Volgende',
      checkin_prev: 'Terug',
      checkin_submit: 'Check-in Opslaan',
      checkin_success: 'Check-in succesvol opgeslagen!',
      checkin_cancel: 'Annuleren',

      /* Scale Labels */
      mood_1: 'Zeer Slecht',
      mood_2: 'Slecht',
      mood_3: 'Ok\u00e9',
      mood_4: 'Goed',
      mood_5: 'Geweldig',
      physical_1: 'Zeer Slecht',
      physical_2: 'Slecht',
      physical_3: 'Gemiddeld',
      physical_4: 'Goed',
      physical_5: 'Uitstekend',
      sleep_1: 'Verschrikkelijk',
      sleep_2: 'Slecht',
      sleep_3: 'Matig',
      sleep_4: 'Goed',
      sleep_5: 'Uitstekend',
      nutrition_1: 'Zeer Slecht',
      nutrition_2: 'Slecht',
      nutrition_3: 'Gemiddeld',
      nutrition_4: 'Goed',
      nutrition_5: 'Uitstekend',
      stress_1: 'Minimaal',
      stress_2: 'Laag',
      stress_3: 'Matig',
      stress_4: 'Hoog',
      stress_5: 'Extreem',

      /* Mood Emojis */
      mood_emoji_1: '\uD83D\uDE22',
      mood_emoji_2: '\uD83D\uDE15',
      mood_emoji_3: '\uD83D\uDE10',
      mood_emoji_4: '\uD83D\uDE0A',
      mood_emoji_5: '\uD83D\uDE04',

      /* Metrics */
      metrics_weight: 'Gewicht (kg)',
      metrics_sleep_hours: 'Slaapuren',
      metrics_workout: 'Training (min)',
      metrics_save: 'Metingen Opslaan',
      metrics_saved: 'Metingen opgeslagen!',

      /* Insights */
      insights_title: 'Inzichten',
      insights_need_more: 'Voltooi minstens 7 check-ins om inzichten te ontgrendelen.',
      insights_checkins_count: 'check-ins tot nu toe',
      insights_trends: 'Trends',
      insights_advice: 'Persoonlijk Advies',
      insights_patterns: 'Patronen',
      insights_reports: 'Maandrapport',
      insights_improving: 'Verbeterend',
      insights_declining: 'Achteruitgaand',
      insights_stable: 'Stabiel',
      insights_avg: 'gem.',

      /* Mental Health */
      mind_title: 'Mind',
      mind_breathing_title: 'Ademhalingsoefening',
      mind_breathing_desc: 'Kalmeer je zenuwstelsel met 4-7-8 ademhaling',
      mind_breathing_start: 'Start Ademhaling',
      mind_breathing_stop: 'Stop',
      mind_breathe_in: 'Adem In...',
      mind_hold: 'Vasthouden...',
      mind_breathe_out: 'Adem Uit...',
      mind_get_ready: 'Maak je klaar...',
      mind_journal_title: 'Veilige Plek Dagboek',
      mind_journal_desc: 'Schrijf wat je bezighoudt. Niemand ziet dit behalve jij.',
      mind_journal_placeholder: 'laat het er allemaal uit... dit is alleen voor jou',
      mind_journal_save: 'Opslaan',
      mind_journal_saved: 'Dagboek opgeslagen',
      mind_journal_history: 'Eerdere Notities',
      mind_grounding_title: '5-4-3-2-1 Grounding',
      mind_grounding_desc: 'Als angst toeslaat, aardeer jezelf met je zintuigen',
      mind_grounding_5: '5 dingen die je kunt ZIEN',
      mind_grounding_4: '4 dingen die je kunt VOELEN',
      mind_grounding_3: '3 dingen die je kunt HOREN',
      mind_grounding_2: '2 dingen die je kunt RUIKEN',
      mind_grounding_1: '1 ding dat je kunt PROEVEN',
      mind_grounding_start: 'Start Oefening',
      mind_grounding_next: 'Volgende',
      mind_grounding_done: 'Klaar! Je bent hier. Je bent veilig.',
      mind_affirmation_title: 'Dagelijkse Affirmatie',
      mind_crisis_title: 'Nu Hulp Nodig?',
      mind_crisis_desc: 'Als je in crisis bent, neem contact op:',
      mind_crisis_line1: '988 Suicide & Crisis Lifeline',
      mind_crisis_line1_num: 'Bel of sms 988',
      mind_crisis_line2: 'Crisis Text Line',
      mind_crisis_line2_num: 'Sms HOME naar 741741',
      mind_crisis_line3: '113 Zelfmoordpreventie (NL)',
      mind_crisis_line3_num: 'Bel 113 of 0800-0113',
      mind_sos_btn: 'Praat Nu Met Iemand',

      /* Ambient Sounds */
      mind_sounds_title: 'Omgevingsgeluid',
      mind_sound_rain: 'Regen',
      mind_sound_ocean: 'Oceaan',
      mind_sound_forest: 'Bos',
      mind_sound_off: 'Uit',
      mind_sound_volume: 'Volume',

      /* Chat */
      chat_title: 'Chat',
      chat_placeholder: 'praat met me over alles...',
      chat_welcome: 'hey, hoe is ie. je kan met me praten over alles - hoe je je voelt, mood, slaap, stress, of gewoon even ventileren. kan ook je gezondheidsdata erbij pakken als je wilt. zero oordeel',
      chat_send: 'Verstuur',

      /* Reports */
      reports_title: 'Maandrapport',
      reports_need_more: 'Voltooi minstens 30 dagen check-ins om een volledig rapport te genereren.',
      reports_days_count: 'dagen data tot nu toe',
      reports_generate: 'Rapport Genereren',
      reports_habits: 'Gewoonten Samenvatting',
      reports_improvements: 'Verbeteringen',
      reports_warnings: 'Waarschuwingen',
      reports_suggestions: 'Suggesties',

      /* Settings */
      settings_title: 'Instellingen',
      settings_appearance: 'Uiterlijk',
      settings_theme: 'Thema',
      settings_theme_light: 'Licht',
      settings_theme_dark: 'Donker',
      settings_accent: 'Accentkleur',
      settings_sounds: 'Geluidseffecten',
      settings_language: 'Taal',
      settings_reminders: 'Dagelijkse Herinneringen',
      settings_reminder_time: 'Herinneringstijd',
      settings_reminder_enabled: 'Herinneringen ingeschakeld',
      settings_reminder_disabled: 'Herinneringen uitgeschakeld',
      settings_export: 'Data Exporteren',
      settings_export_desc: 'Download al je data als JSON',
      settings_clear: 'Alle Data Wissen',
      settings_clear_desc: 'Verwijder alle opgeslagen data permanent',
      settings_clear_confirm: 'Weet je zeker dat je alle data wilt verwijderen? Dit kan niet ongedaan worden.',
      settings_cleared: 'Alle data gewist.',
      settings_about: 'Over HealthPulse',
      settings_about_text: 'Een privacy-first gezondheids-tracking PWA. Alle data blijft op je apparaat.',
      settings_version: 'Versie 1.0.0',
      settings_back: 'Terug',

      /* Notifications */
      notification_title: 'HealthPulse Herinnering',
      notification_body: 'Tijd voor je dagelijkse gezondheidscheck!',
      notification_permission_denied: 'Notificatietoestemming geweigerd. Schakel het in via je browserinstellingen.',

      /* General */
      btn_save: 'Opslaan',
      btn_cancel: 'Annuleren',
      btn_close: 'Sluiten',
      loading: 'Laden...',
      no_data: 'Nog geen data',
      today: 'Vandaag',
      yesterday: 'Gisteren',

      /* Gamification */
      wellness_score: 'Welzijnsscore',
      wellness_excellent: 'Uitstekend',
      wellness_good: 'Goed',
      wellness_fair: 'Matig',
      wellness_poor: 'Aandacht nodig',
      wellness_no_data: 'Check in om je score te zien',

      level_title: 'Level',
      level_1: 'Beginner',
      level_2: 'Regelmatig',
      level_3: 'Toegewijd',
      level_4: 'Vastberaden',
      level_5: 'Veteraan',
      level_6: 'Meester',
      xp_label: 'XP',
      xp_to_next: 'naar volgend level',
      xp_max: 'Max level bereikt!',

      achievements_title: 'Prestaties',
      achievements_locked: 'Ga door om te ontgrendelen!',
      achievement_first_checkin: 'Eerste Check-in',
      achievement_streak_3: '3-Dagen Streak',
      achievement_streak_7: 'Weekstrijder',
      achievement_streak_14: 'Twee-Weken Held',
      achievement_streak_30: 'Maandlegende',
      achievement_total_10: 'Tien Sterk',
      achievement_total_50: 'Halve Eeuw',
      achievement_total_100: 'Honderdman',
      achievement_metrics_7: 'Metingen Pro',
      achievement_low_stress: 'Zen Meester',
      achievement_good_sleep: 'Droomvanger',
      achievement_happy_week: 'Blije Kampeerder',

      daily_quote: 'Dagelijkse Motivatie',
      mood_this_week: 'Jouw Week',
      mood_no_week_data: 'Check dagelijks in om je week te zien',

      celebration_title: 'Check-in Voltooid!',
      celebration_xp_earned: 'XP verdiend',
      celebration_streak: 'dagen streak!',
      celebration_new_badge: 'Nieuwe Prestatie Ontgrendeld!',
      celebration_continue: 'Doorgaan',
      celebration_great: 'Goed gedaan!',
      celebration_keep_going: 'Houd het momentum vast!',
      celebration_first: 'Je reis begint!',

      /* Pet */
      pet_name: 'Pulse',
      pet_happy: 'Blij & Gezond',
      pet_good: 'Voelt Goed',
      pet_neutral: 'Gaat Wel',
      pet_sad: 'Heeft Zorg Nodig',
      pet_stressed: 'Gespannen',
      pet_sleepy: 'Wacht op je...',
      pet_tap_hint: 'Tik me voor een tip!',

      /* Daily Quests */
      quests_title: 'Dagelijkse Quests',
      quests_bonus: 'bonus XP',
      quests_all_done: 'Alle quests voltooid!',
      q_checkin: 'Voltooi je dagelijkse check-in',
      q_mood_4: 'Beoordeel je stemming Goed of hoger',
      q_sleep_4: 'Beoordeel je slaap Goed of hoger',
      q_stress_low: 'Houd stress op Laag of minder',
      q_nutrition_4: 'Beoordeel voeding Goed of hoger',
      q_physical_4: 'Beoordeel fysieke conditie Goed+',
      q_log_weight: 'Log je gewicht vandaag',
      q_workout_20: 'Log 20+ minuten beweging',
      q_sleep_7h: 'Log 7+ uur slaap',
      q_log_symptoms: 'Schrijf je symptomen op',

      /* Streak Multiplier */
      multiplier_label: 'XP Boost',
      multiplier_hint: '3-dagen streak om te ontgrendelen!',

      /* Weekly Challenges */
      wc_title: 'Weekuitdaging',
      wc_progress: 'Voortgang',
      wc_completed: 'Uitdaging Voltooid!',
      wc_walk_10: 'Beweeg 10+ min voor 5 dagen',
      wc_journal_3: 'Schrijf 3 keer in je dagboek',
      wc_mood_4_three: 'Beoordeel mood Goed+ voor 3 dagen',
      wc_log_metrics_5: 'Log metingen voor 5 dagen',
      wc_checkin_every_day: 'Check elke dag in deze week',
      wc_low_stress_3: 'Houd stress Laag voor 3 dagen',
      wc_sleep_good_4: 'Beoordeel slaap Goed+ voor 4 dagen',
      wc_nutrition_4_three: 'Beoordeel voeding Goed+ voor 3 dagen',
      wc_workout_30_three: 'Train 30+ min voor 3 dagen',
      wc_sleep_7h_5: 'Slaap 7+ uur voor 5 dagen',

      /* Medication Reminders */
      meds_title: 'Medicatie',
      meds_add: 'Medicatie Toevoegen',
      meds_name: 'Medicatienaam',
      meds_dose: 'Dosis',
      meds_time: 'Tijd',
      meds_taken: 'ingenomen',
      meds_empty: 'Nog geen medicatie toegevoegd',
      meds_all_taken: 'Alles ingenomen!',
      meds_save: 'Opslaan',
      meds_delete_confirm: 'Medicatie verwijderen?',
      meds_added: 'Medicatie toegevoegd!',

      /* Sleep Score */
      sleep_score_title: 'Slaapscore',
      sleep_score_quality: 'Kwaliteit',
      sleep_score_hours: 'Uren',

      /* Export PDF */
      reports_export_pdf: 'Download als PDF',
      reports_pdf_title: 'HealthPulse Maandrapport',

      /* Days of week (short) */
      day_mon: 'Ma',
      day_tue: 'Di',
      day_wed: 'Wo',
      day_thu: 'Do',
      day_fri: 'Vr',
      day_sat: 'Za',
      day_sun: 'Zo'
    }
  };

  /** Currently active language */
  var currentLang = 'en';

  /**
   * Get a translated string by key.
   * Falls back to English if the key is missing in the current language.
   * @param {string} key - Translation key
   * @returns {string} Translated text or the key itself as fallback
   */
  function t(key) {
    if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key] !== undefined) {
      return TRANSLATIONS[currentLang][key];
    }
    if (TRANSLATIONS.en[key] !== undefined) {
      return TRANSLATIONS.en[key];
    }
    return key;
  }

  /**
   * Get the current active language code.
   * @returns {string} 'en' or 'nl'
   */
  function getLang() {
    return currentLang;
  }

  /**
   * Set the active language and update the document lang attribute.
   * @param {string} lang - Language code ('en' or 'nl')
   */
  function setLanguage(lang) {
    if (lang === 'en' || lang === 'nl') {
      currentLang = lang;
      document.documentElement.lang = lang;
    }
  }

  /**
   * Show a specific app screen and hide all others.
   * Updates the bottom navigation active state.
   * @param {string} screenId - Screen element ID suffix (e.g. 'home', 'checkin')
   */
  function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
      screens[i].classList.remove('active');
    }
    var target = document.getElementById('screen-' + screenId);
    if (target) {
      target.classList.add('active');
    }

    /* Update bottom nav active state */
    var navBtns = document.querySelectorAll('#bottom-nav button');
    for (var j = 0; j < navBtns.length; j++) {
      navBtns[j].classList.remove('active');
      if (navBtns[j].getAttribute('data-screen') === screenId) {
        navBtns[j].classList.add('active');
      }
    }

    /* Update header title */
    var titleMap = {
      home: 'app_name',
      checkin: 'checkin_title',
      mind: 'mind_title',
      insights: 'insights_title',
      chat: 'chat_title',
      settings: 'settings_title',
      reports: 'reports_title'
    };
    var headerTitle = document.getElementById('header-title');
    if (headerTitle && titleMap[screenId]) {
      headerTitle.textContent = t(titleMap[screenId]);
    }
  }

  /**
   * Display a toast notification at the bottom of the screen.
   * Auto-dismisses after 3 seconds.
   * @param {string} message - Message to display
   * @param {string} [type='success'] - Toast type: 'success', 'error', or 'info'
   */
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast ' + (type || 'success');
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 3000);
  }

  /**
   * Get a time-based greeting string.
   * @returns {string} Greeting key based on current hour
   */
  function getGreetingKey() {
    var hour = new Date().getHours();
    if (hour < 12) return 'dashboard_greeting_morning';
    if (hour < 18) return 'dashboard_greeting_afternoon';
    return 'dashboard_greeting_evening';
  }

  /**
   * Format a date string (YYYY-MM-DD) for display.
   * Shows "Today" or "Yesterday" for recent dates.
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @returns {string} Formatted date string
   */
  function formatDate(dateStr) {
    var today = new Date();
    var todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    var yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');

    if (dateStr === todayStr) return t('today');
    if (dateStr === yesterdayStr) return t('yesterday');

    var parts = dateStr.split('-');
    return parts[2] + '/' + parts[1];
  }

  /**
   * Create HTML for a 1-5 rating selector with labels and emojis.
   * @param {string} field - Field name (mood, physical, sleep, nutrition, stress)
   * @param {number} [selectedValue] - Pre-selected value (1-5)
   * @returns {string} HTML string for the rating selector
   */
  function createRatingSelector(field, selectedValue) {
    var html = '<div class="rating-selector" data-field="' + field + '">';
    for (var i = 1; i <= 5; i++) {
      var label = t(field + '_' + i);
      var emoji = field === 'mood' ? t('mood_emoji_' + i) : '';
      var selected = (selectedValue === i) ? ' selected' : '';
      html += '<button class="rating-btn' + selected + '" data-value="' + i + '" type="button">';
      if (emoji) {
        html += '<span class="rating-emoji">' + emoji + '</span>';
      } else {
        html += '<span class="rating-number">' + i + '</span>';
      }
      html += '<span class="rating-label">' + label + '</span>';
      html += '</button>';
    }
    html += '</div>';
    return html;
  }

  /**
   * Create HTML for a mini bar chart showing 7 days of data.
   * Used on the dashboard for week overview.
   * @param {Array} values - Array of { date, value } objects (max 7)
   * @param {number} maxVal - Maximum possible value for scaling
   * @returns {string} HTML string for the chart
   */
  function createMiniChart(values, maxVal) {
    var dayKeys = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
    var html = '<div class="mini-chart">';

    for (var i = 0; i < values.length; i++) {
      var pct = maxVal > 0 ? Math.round((values[i].value / maxVal) * 100) : 0;
      var dayOfWeek = new Date(values[i].date + 'T12:00:00').getDay();
      var dayLabel = t(dayKeys[dayOfWeek]);

      html += '<div class="chart-bar-container">';
      html += '<div class="chart-bar" style="height: ' + pct + '%">';
      html += '<span class="chart-value">' + values[i].value + '</span>';
      html += '</div>';
      html += '<span class="chart-day">' + dayLabel + '</span>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Create an icon SVG string for use in the UI.
   * Returns simple SVG icons for common UI elements.
   * @param {string} name - Icon name
   * @returns {string} SVG markup string
   */
  function icon(name) {
    var icons = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      checkin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      insights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>',
      settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
      back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>',
      send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
      bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
      globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      award: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
      alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      heart: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
      mind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="10" y1="23" x2="14" y2="23"/><path d="M12 2v4M8.5 5.5l2 2M15.5 5.5l-2 2"/></svg>',
      wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"/></svg>',
      edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
      shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>',
      sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>',
      palette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.63 1.5-1.43 0-.35-.12-.68-.36-.96-.22-.26-.35-.6-.35-.97 0-.78.63-1.42 1.42-1.42H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9.18-10-9.22z"/></svg>',
      pill: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 1.5l-8.5 8.5a4.95 4.95 0 007 7l8.5-8.5a4.95 4.95 0 00-7-7z"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"/></svg>',
      pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    };
    return icons[name] || '';
  }

  /** Public API */
  return {
    t: t,
    getLang: getLang,
    setLanguage: setLanguage,
    showScreen: showScreen,
    showToast: showToast,
    getGreetingKey: getGreetingKey,
    formatDate: formatDate,
    createRatingSelector: createRatingSelector,
    createMiniChart: createMiniChart,
    icon: icon,
    TRANSLATIONS: TRANSLATIONS
  };
})();
