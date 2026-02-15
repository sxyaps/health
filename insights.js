/**
 * HealthPulse - Insights Engine
 * Deterministic, rule-based analysis of health check-in data.
 * Detects trends, generates advice, finds patterns, and creates reports.
 * No AI or external API calls — all logic is local and transparent.
 */
window.HealthInsights = (function () {
  'use strict';

  /** Check-in fields that use the 1-5 scale */
  var CHECKIN_FIELDS = ['mood', 'physical', 'sleep', 'nutrition', 'stress'];

  /**
   * Calculate the arithmetic mean of a numeric array.
   * @param {number[]} arr - Array of numbers
   * @returns {number} Mean value, or 0 for empty arrays
   */
  function average(arr) {
    if (arr.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  }

  /**
   * Round a number to one decimal place.
   * @param {number} n - Number to round
   * @returns {number} Rounded number
   */
  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  /**
   * Determine the trend direction for a series of values.
   * Compares the average of the first half to the second half.
   * For stress, lower is better so the interpretation is inverted.
   * @param {number[]} values - Ordered array of metric values
   * @param {string} field - Field name (used to handle stress inversion)
   * @returns {string} 'improving', 'declining', or 'stable'
   */
  function trendDirection(values, field) {
    if (values.length < 4) return 'stable';
    var half = Math.floor(values.length / 2);
    var olderAvg = average(values.slice(0, half));
    var newerAvg = average(values.slice(half));
    var diff = newerAvg - olderAvg;
    var threshold = 0.3;

    if (field === 'stress') {
      if (diff < -threshold) return 'improving';
      if (diff > threshold) return 'declining';
      return 'stable';
    }
    if (diff > threshold) return 'improving';
    if (diff < -threshold) return 'declining';
    return 'stable';
  }

  /**
   * Analyze trends across all check-in fields.
   * Returns per-field statistics including direction, average, and recent values.
   * @param {Array} checkIns - Array of check-in records
   * @returns {Object} Keyed by field name, each containing trend data
   */
  function analyzeTrends(checkIns) {
    var trends = {};
    CHECKIN_FIELDS.forEach(function (field) {
      var values = [];
      for (var i = 0; i < checkIns.length; i++) {
        if (checkIns[i][field] != null) {
          values.push(checkIns[i][field]);
        }
      }
      if (values.length < 2) {
        trends[field] = {
          direction: 'stable',
          average: 0,
          latest: 0,
          min: 0,
          max: 0,
          values: []
        };
        return;
      }
      trends[field] = {
        direction: trendDirection(values, field),
        average: round1(average(values)),
        latest: values[values.length - 1],
        min: Math.min.apply(null, values),
        max: Math.max.apply(null, values),
        values: values.slice(-7)
      };
    });
    return trends;
  }

  /**
   * Generate rule-based personalized advice from health data.
   * Each rule checks a specific condition and provides bilingual advice.
   * @param {Array} checkIns - Check-in records
   * @param {Array} metrics - Metric records
   * @returns {Array<Object>} Advice items with type, en, and nl text
   */
  function generateAdvice(checkIns, metrics) {
    if (checkIns.length < 3) return [];
    var advice = [];
    var trends = analyzeTrends(checkIns);
    var recent = checkIns.slice(-7);

    /* Rule: Persistently low mood */
    if (trends.mood.average < 2.5 && checkIns.length >= 5) {
      advice.push({
        type: 'warning',
        en: 'Your mood has been consistently low. Consider talking to someone you trust or trying activities that bring you joy.',
        nl: 'Je stemming is aanhoudend laag geweest. Overweeg om met iemand te praten die je vertrouwt of probeer activiteiten die je blij maken.'
      });
    }

    /* Rule: Mood improving */
    if (trends.mood.direction === 'improving') {
      advice.push({
        type: 'positive',
        en: 'Your mood is trending upward — keep doing what works for you!',
        nl: 'Je stemming gaat omhoog — ga door met wat voor jou werkt!'
      });
    }

    /* Rule: Mood declining */
    if (trends.mood.direction === 'declining') {
      advice.push({
        type: 'info',
        en: 'Your mood has been trending downward. Try to identify what changed and consider adding positive activities to your routine.',
        nl: 'Je stemming vertoont een dalende trend. Probeer te achterhalen wat er veranderd is en voeg positieve activiteiten toe aan je routine.'
      });
    }

    /* Rule: Poor sleep quality */
    if (trends.sleep.average < 2.5 && checkIns.length >= 5) {
      advice.push({
        type: 'warning',
        en: 'Your sleep quality has been poor. Try maintaining a consistent sleep schedule and reducing screen time before bed.',
        nl: 'Je slaapkwaliteit is slecht geweest. Probeer een vast slaapschema aan te houden en verminder schermtijd voor het slapen.'
      });
    }

    /* Rule: Sleep improving */
    if (trends.sleep.direction === 'improving') {
      advice.push({
        type: 'positive',
        en: 'Your sleep quality is improving. Whatever changes you made are working!',
        nl: 'Je slaapkwaliteit verbetert. De veranderingen die je hebt gemaakt werken!'
      });
    }

    /* Rule: High stress levels */
    if (trends.stress.average > 3.5) {
      advice.push({
        type: 'warning',
        en: 'Your stress levels are elevated. Consider relaxation techniques like deep breathing, meditation, or gentle exercise.',
        nl: 'Je stressniveaus zijn verhoogd. Overweeg ontspanningstechnieken zoals diepe ademhaling, meditatie of lichte beweging.'
      });
    }

    /* Rule: Stress decreasing */
    if (trends.stress.direction === 'improving') {
      advice.push({
        type: 'positive',
        en: 'Your stress levels are decreasing — great progress in managing stress!',
        nl: 'Je stressniveaus dalen — geweldige voortgang in stressmanagement!'
      });
    }

    /* Rule: Poor nutrition */
    if (trends.nutrition.average < 2.5 && checkIns.length >= 5) {
      advice.push({
        type: 'warning',
        en: 'Your nutrition ratings have been low. Try planning meals ahead and including more fruits and vegetables.',
        nl: 'Je voedingsscores zijn laag geweest. Probeer maaltijden vooruit te plannen en meer groenten en fruit te eten.'
      });
    }

    /* Rule: Nutrition improving */
    if (trends.nutrition.direction === 'improving') {
      advice.push({
        type: 'positive',
        en: 'Your nutrition habits are improving. Keep making healthy food choices!',
        nl: 'Je voedingsgewoonten verbeteren. Blijf gezonde voedingskeuzes maken!'
      });
    }

    /* Rule: Physical condition declining */
    if (trends.physical.direction === 'declining') {
      advice.push({
        type: 'info',
        en: 'Your physical condition has been declining. Regular light exercise and adequate rest can help improve it.',
        nl: 'Je fysieke conditie gaat achteruit. Regelmatige lichte beweging en voldoende rust kunnen helpen.'
      });
    }

    /* Rule: Good overall wellness */
    var wellnessScore = (
      trends.mood.average +
      trends.physical.average +
      trends.sleep.average +
      trends.nutrition.average +
      (6 - trends.stress.average)
    ) / 5;
    if (wellnessScore > 3.5 && checkIns.length >= 5) {
      advice.push({
        type: 'positive',
        en: 'Your overall wellness is looking great! You are maintaining healthy habits.',
        nl: 'Je algehele welzijn ziet er geweldig uit! Je houdt gezonde gewoonten aan.'
      });
    }

    /* Rule: High stress paired with poor sleep */
    var recentStress = average(recent.map(function (c) { return c.stress || 3; }));
    var recentSleep = average(recent.map(function (c) { return c.sleep || 3; }));
    if (recentStress > 3 && recentSleep < 3) {
      advice.push({
        type: 'info',
        en: 'High stress and poor sleep often go together. Try addressing your stress to improve sleep quality.',
        nl: 'Hoge stress en slechte slaap gaan vaak samen. Probeer je stress aan te pakken om de slaapkwaliteit te verbeteren.'
      });
    }

    /* Rule: Low workout minutes from metrics */
    if (metrics && metrics.length >= 3) {
      var recentMetrics = metrics.slice(-7);
      var avgWorkout = average(recentMetrics.map(function (m) { return m.workoutMinutes || 0; }));
      var avgSleepHrs = average(recentMetrics.filter(function (m) { return m.sleepHours > 0; }).map(function (m) { return m.sleepHours; }));

      if (avgWorkout < 15 && avgWorkout >= 0) {
        advice.push({
          type: 'info',
          en: 'You are averaging less than 15 minutes of exercise daily. Try to aim for at least 30 minutes of moderate activity.',
          nl: 'Je gemiddelde beweging is minder dan 15 minuten per dag. Probeer minstens 30 minuten matige activiteit te halen.'
        });
      }
      if (avgSleepHrs > 0 && avgSleepHrs < 7) {
        advice.push({
          type: 'warning',
          en: 'You are averaging less than 7 hours of sleep. Adults need 7-9 hours for optimal health.',
          nl: 'Je slaapt gemiddeld minder dan 7 uur. Volwassenen hebben 7-9 uur nodig voor optimale gezondheid.'
        });
      }
      if (avgSleepHrs >= 7 && avgSleepHrs <= 9) {
        advice.push({
          type: 'positive',
          en: 'Your sleep duration is in the healthy range of 7-9 hours. Keep it up!',
          nl: 'Je slaapduur zit in het gezonde bereik van 7-9 uur. Ga zo door!'
        });
      }
    }

    return advice;
  }

  /**
   * Detect recurring patterns in check-in data.
   * Examines weekly rhythms, correlations, and symptom frequency.
   * @param {Array} checkIns - Check-in records (minimum 7 needed)
   * @returns {Array<Object>} Detected pattern descriptions
   */
  function detectPatterns(checkIns) {
    if (checkIns.length < 7) return [];
    var patterns = [];

    /* Pattern: Weekend vs weekday mood difference */
    var weekdayMoods = [];
    var weekendMoods = [];
    checkIns.forEach(function (c) {
      var dayOfWeek = new Date(c.date + 'T12:00:00').getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendMoods.push(c.mood);
      } else {
        weekdayMoods.push(c.mood);
      }
    });
    if (weekdayMoods.length > 0 && weekendMoods.length > 0) {
      var weekdayAvg = average(weekdayMoods);
      var weekendAvg = average(weekendMoods);
      if (weekendAvg - weekdayAvg > 0.5) {
        patterns.push({
          type: 'info',
          en: 'Your mood tends to be better on weekends than weekdays.',
          nl: 'Je stemming is meestal beter in het weekend dan doordeweeks.'
        });
      } else if (weekdayAvg - weekendAvg > 0.5) {
        patterns.push({
          type: 'info',
          en: 'Your mood tends to be better on weekdays than weekends.',
          nl: 'Je stemming is meestal beter doordeweeks dan in het weekend.'
        });
      }
    }

    /* Pattern: Mood-physical condition correlation */
    var recent14 = checkIns.slice(-14);
    if (recent14.length >= 5) {
      var moodVals = recent14.map(function (c) { return c.mood; });
      var physVals = recent14.map(function (c) { return c.physical; });
      var moodAvg = average(moodVals);
      var physAvg = average(physVals);
      var numerator = 0;
      var denomA = 0;
      var denomB = 0;
      for (var i = 0; i < recent14.length; i++) {
        var dm = moodVals[i] - moodAvg;
        var dp = physVals[i] - physAvg;
        numerator += dm * dp;
        denomA += dm * dm;
        denomB += dp * dp;
      }
      if (denomA > 0 && denomB > 0) {
        var correlation = numerator / Math.sqrt(denomA * denomB);
        if (correlation > 0.6) {
          patterns.push({
            type: 'info',
            en: 'Your mood and physical condition are strongly correlated. Taking care of your body helps your mind too.',
            nl: 'Je stemming en fysieke conditie zijn sterk gecorreleerd. Zorgen voor je lichaam helpt ook je geest.'
          });
        }
      }
    }

    /* Pattern: Persistent high stress streak */
    var last7 = checkIns.slice(-7);
    var highStressDays = last7.filter(function (c) { return c.stress >= 4; }).length;
    if (highStressDays >= 5) {
      patterns.push({
        type: 'warning',
        en: 'You have had high stress for ' + highStressDays + ' of the last 7 days. Consider making changes to reduce your stress load.',
        nl: 'Je hebt ' + highStressDays + ' van de laatste 7 dagen hoge stress gehad. Overweeg veranderingen om je stressbelasting te verminderen.'
      });
    }

    /* Pattern: Frequent symptoms reported */
    var last14 = checkIns.slice(-14);
    var symptomDays = last14.filter(function (c) {
      return c.symptoms && c.symptoms.trim().length > 0;
    }).length;
    if (symptomDays >= 7) {
      patterns.push({
        type: 'warning',
        en: 'You have reported symptoms on ' + symptomDays + ' of the last ' + last14.length + ' days. Consider consulting a healthcare professional.',
        nl: 'Je hebt ' + symptomDays + ' van de laatste ' + last14.length + ' dagen symptomen gemeld. Overweeg een zorgprofessional te raadplegen.'
      });
    }

    /* Pattern: Consistent low nutrition */
    var lowNutritionDays = last7.filter(function (c) { return c.nutrition <= 2; }).length;
    if (lowNutritionDays >= 4) {
      patterns.push({
        type: 'info',
        en: 'You have rated your nutrition poorly on most recent days. Meal planning could help improve consistency.',
        nl: 'Je hebt je voeding de meeste recente dagen slecht beoordeeld. Maaltijdplanning kan helpen de consistentie te verbeteren.'
      });
    }

    /* Pattern: Improving overall trend */
    var allImproving = CHECKIN_FIELDS.filter(function (f) {
      return analyzeTrends(checkIns)[f].direction === 'improving';
    });
    if (allImproving.length >= 3) {
      patterns.push({
        type: 'positive',
        en: 'Multiple health areas are improving simultaneously. Your efforts are paying off!',
        nl: 'Meerdere gezondheidsgebieden verbeteren tegelijkertijd. Je inspanningen werpen vruchten af!'
      });
    }

    return patterns;
  }

  /**
   * Generate a comprehensive 30-day health report.
   * Organized into four sections: habits, improvements, warnings, suggestions.
   * @param {Array} checkIns - All check-in records
   * @param {Array} metrics - All metric records
   * @returns {Object} Report with bilingual text arrays per section
   */
  function generateReport(checkIns, metrics) {
    var recent30 = checkIns.slice(-30);
    var recentMetrics = metrics ? metrics.slice(-30) : [];
    var trends = analyzeTrends(recent30);

    var report = {
      habits: { en: [], nl: [] },
      improvements: { en: [], nl: [] },
      warnings: { en: [], nl: [] },
      suggestions: { en: [], nl: [] }
    };

    /* --- Habits Summary --- */
    report.habits.en.push('You completed ' + recent30.length + ' check-ins in the last 30 days.');
    report.habits.nl.push('Je hebt ' + recent30.length + ' check-ins voltooid in de afgelopen 30 dagen.');

    CHECKIN_FIELDS.forEach(function (field) {
      var t = trends[field];
      if (t && t.average > 0) {
        var label = field.charAt(0).toUpperCase() + field.slice(1);
        report.habits.en.push(label + ' average: ' + t.average + '/5');
        report.habits.nl.push(label + ' gemiddelde: ' + t.average + '/5');
      }
    });

    if (recentMetrics.length > 0) {
      var weightEntries = recentMetrics.filter(function (m) { return m.weight > 0; });
      var sleepEntries = recentMetrics.filter(function (m) { return m.sleepHours > 0; });
      var workoutEntries = recentMetrics.filter(function (m) { return m.workoutMinutes > 0; });

      if (weightEntries.length > 0) {
        var avgW = round1(average(weightEntries.map(function (m) { return m.weight; })));
        report.habits.en.push('Average weight: ' + avgW + ' kg');
        report.habits.nl.push('Gemiddeld gewicht: ' + avgW + ' kg');
      }
      if (sleepEntries.length > 0) {
        var avgS = round1(average(sleepEntries.map(function (m) { return m.sleepHours; })));
        report.habits.en.push('Average sleep duration: ' + avgS + ' hours');
        report.habits.nl.push('Gemiddelde slaapduur: ' + avgS + ' uur');
      }
      if (workoutEntries.length > 0) {
        var avgWk = Math.round(average(workoutEntries.map(function (m) { return m.workoutMinutes; })));
        report.habits.en.push('Average workout: ' + avgWk + ' minutes/day');
        report.habits.nl.push('Gemiddelde training: ' + avgWk + ' minuten/dag');
      }
    }

    /* --- Improvements --- */
    CHECKIN_FIELDS.forEach(function (field) {
      if (trends[field].direction === 'improving') {
        var label = field.charAt(0).toUpperCase() + field.slice(1);
        report.improvements.en.push(label + ' has been improving over this period.');
        report.improvements.nl.push(label + ' is verbeterd gedurende deze periode.');
      }
    });
    if (report.improvements.en.length === 0) {
      report.improvements.en.push('No significant improvements detected in this period.');
      report.improvements.nl.push('Geen significante verbeteringen gedetecteerd in deze periode.');
    }

    /* --- Warnings --- */
    CHECKIN_FIELDS.forEach(function (field) {
      if (trends[field].direction === 'declining') {
        var label = field.charAt(0).toUpperCase() + field.slice(1);
        if (field === 'stress') {
          report.warnings.en.push(label + ' levels have been increasing.');
          report.warnings.nl.push(label + 'niveaus zijn gestegen.');
        } else {
          report.warnings.en.push(label + ' has been declining.');
          report.warnings.nl.push(label + ' is achteruitgegaan.');
        }
      }
    });
    if (trends.mood.average < 2.5 && recent30.length >= 10) {
      report.warnings.en.push('Persistently low mood detected. Please consider reaching out for professional support.');
      report.warnings.nl.push('Aanhoudend lage stemming gedetecteerd. Overweeg professionele ondersteuning te zoeken.');
    }
    if (report.warnings.en.length === 0) {
      report.warnings.en.push('No significant warnings for this period. Keep up the good work!');
      report.warnings.nl.push('Geen significante waarschuwingen voor deze periode. Ga zo door!');
    }

    /* --- Suggestions --- */
    if (trends.sleep.average < 3) {
      report.suggestions.en.push('Focus on improving sleep hygiene: consistent bedtime, dark room, no screens 1 hour before bed.');
      report.suggestions.nl.push('Focus op slaaphygiëne: vast bedtijd, donkere kamer, geen schermen 1 uur voor het slapen.');
    }
    if (trends.stress.average > 3) {
      report.suggestions.en.push('Incorporate daily relaxation: 10 minutes of meditation, deep breathing, or a short walk.');
      report.suggestions.nl.push('Bouw dagelijkse ontspanning in: 10 minuten meditatie, diepe ademhaling of een korte wandeling.');
    }
    if (trends.nutrition.average < 3) {
      report.suggestions.en.push('Plan your meals for the week and include a variety of whole foods, fruits, and vegetables.');
      report.suggestions.nl.push('Plan je maaltijden voor de week en voeg verscheidenheid aan volwaardige voeding, fruit en groenten toe.');
    }
    if (trends.physical.average < 3) {
      report.suggestions.en.push('Start with gentle daily movement: a 20-minute walk, stretching, or yoga.');
      report.suggestions.nl.push('Begin met dagelijkse lichte beweging: 20 minuten wandelen, stretchen of yoga.');
    }
    if (trends.mood.average < 3 && trends.stress.average > 3) {
      report.suggestions.en.push('Your mood and stress are both struggling. Consider journaling or talking to a friend regularly.');
      report.suggestions.nl.push('Je stemming en stress hebben allebei aandacht nodig. Overweeg een dagboek bij te houden of regelmatig met een vriend te praten.');
    }
    if (report.suggestions.en.length === 0) {
      report.suggestions.en.push('You are doing well! Continue your current healthy habits and stay consistent.');
      report.suggestions.nl.push('Je doet het goed! Ga door met je huidige gezonde gewoonten en blijf consistent.');
    }

    return report;
  }

  /**
   * Translate a trend direction into a localized label.
   * @param {string} direction - 'improving', 'declining', or 'stable'
   * @param {string} lang - Language code ('en' or 'nl')
   * @returns {string} Translated direction label
   */
  function translateDirection(direction, lang) {
    var map = {
      improving: { en: 'improving', nl: 'verbeterend' },
      declining: { en: 'declining', nl: 'achteruitgaand' },
      stable: { en: 'stable', nl: 'stabiel' }
    };
    return (map[direction] || map.stable)[lang || 'en'];
  }

  /**
   * Process a natural-language chat query and return a data-driven response.
   * Uses keyword matching to understand intent and responds with stored data.
   * @param {string} query - User's chat message
   * @param {Array} checkIns - All check-in records
   * @param {Array} metrics - All metric records
   * @param {string} lang - Current language ('en' or 'nl')
   * @returns {string} Generated response text
   */
  function processChat(query, checkIns, metrics, lang) {
    var q = query.toLowerCase().trim();
    var l = lang || 'en';

    /* ---- Emotional / Mental Health responses (PRIORITY) ---- */

    /* Crisis detection - always first */
    if (q.match(/kill myself|suicide|suicidal|self.?harm|dont want to live|wil niet meer|zelfmoord|self harm|end it all|want to die|wil dood/)) {
      if (l === 'nl') {
        return 'hey, ik hoor je en dit is serieus. je bent niet alleen hierin 💙\n\nBel alsjeblieft:\n📞 113 Zelfmoordpreventie: 0800-0113\n📞 Crisis: 112\n\nje verdient hulp en er zijn mensen die om je geven. dit gevoel is tijdelijk, ook al voelt het nu niet zo.';
      }
      return 'hey, i hear you and this is serious. you are NOT alone in this 💙\n\nplease reach out:\n📞 988 Suicide & Crisis Lifeline: call/text 988\n📞 Crisis Text Line: text HOME to 741741\n\nyou deserve help and there are people who care about you. this feeling is temporary, even if it doesnt feel like it rn.';
    }

    /* Sadness / Depression */
    if (q.match(/sad|depressed|down|crying|empty|hopeless|verdrietig|depressief|huilen|leeg|somber|neerslachtig|unhappy|miserable|worthless|waardeloos|miss.*someone|mis.*iemand|lost someone|iemand verloren|grief|rouw|mourning|heartbroken|gebroken hart|lonely inside|van binnen|dark place|donkere plek|no point|geen zin|feel nothing|voel niks/)) {
      var sadResponses = l === 'nl' ? [
        'hey, het is helemaal oké om je zo te voelen. soms is het leven gewoon zwaar en dat is valid 💙\n\nik wil dat je weet: het feit dat je hier bent en erover praat? dat is al zo sterk van je.\n\nwat soms helpt:\n• schrijf op wat je voelt (het mind-tab heeft een dagboek!)\n• ga even naar buiten, al is het 5 min\n• bel iemand die je vertrouwt\n\nje hoeft niet alles vandaag op te lossen. stap voor stap 🫶',
        'ik snap het, en je gevoelens zijn 100% geldig. je hoeft niet te doen alsof alles oké is 💙\n\nweet je wat wetenschappelijk bewezen helpt? gewoon bewegen - zelfs een kort wandelingetje van 10 min kan je brainchemistry al veranderen fr.\n\nen hey, wees lief voor jezelf vandaag oké? je verdient dat.'
      ] : [
        'hey, its totally okay to feel this way. sometimes life is just heavy and thats valid 💙\n\ni want u to know: the fact that ure here talking about it? thats already so strong of you.\n\nthings that might help:\n• write down what ur feeling (the mind tab has a journal!)\n• go outside for even 5 min\n• call someone you trust\n\nyou dont have to fix everything today. one step at a time 🫶',
        'i get it, and ur feelings are 100% valid. u dont have to pretend everythings fine 💙\n\nu know what actually helps scientifically? just moving ur body - even a short 10 min walk can literally change ur brain chemistry fr.\n\nand hey, be kind to urself today ok? u deserve that.'
      ];
      return sadResponses[Math.floor(Math.random() * sadResponses.length)];
    }

    /* Anxiety / Worry */
    if (q.match(/anxious|anxiety|worried|nervous|panic|scared|afraid|bang|angstig|angst|paniekerig|ongerust|bezorgd|overthinking|overdenken|spiraling/)) {
      if (l === 'nl') {
        return 'ok ademhalen. je bent veilig rn 💙\n\nangst voelt verschrikkelijk maar het is letterlijk je brein dat probeert je te beschermen - het draaft alleen een beetje door.\n\nprobeer dit nu:\n1. adem in voor 4 sec\n2. houd vast voor 7 sec\n3. adem uit voor 8 sec\n(er zit een ademhalingsoefening in het Mind-tab!)\n\nEN probeer de 5-4-3-2-1 grounding: noem 5 dingen die je ziet, 4 die je voelt, 3 die je hoort, 2 die je ruikt, 1 die je proeft.\n\ndit gaat voorbij. je hebt dit al eerder overleefd en je gaat het weer doen 💪';
      }
      return 'ok breathe. you are safe rn 💙\n\nanxiety feels terrible but its literally ur brain trying to protect you - its just being a bit extra lol.\n\ntry this rn:\n1. breathe in for 4 sec\n2. hold for 7 sec\n3. breathe out for 8 sec\n(theres a breathing exercise in the Mind tab!)\n\nAND try 5-4-3-2-1 grounding: name 5 things u see, 4 u can touch, 3 u hear, 2 u smell, 1 u taste.\n\nthis will pass. youve survived this before and ull do it again 💪';
    }

    /* Anger / Frustration */
    if (q.match(/angry|frustrated|mad|pissed|furious|hate|boos|gefrustreerd|kwaad|woedend|irritated|ge[ïi]rriteerd/)) {
      if (l === 'nl') {
        return 'je frustratie is helemaal terecht. boosheid is een volledig normale emotie en soms is het goed om het gewoon te voelen 🔥\n\nwat kan helpen:\n• pak een kussen en sla erop (serieus, het werkt)\n• schrijf alles op wat je kwaad maakt\n• ga hard lopen of doe push-ups\n• koud water op je polsen\n\nje hoeft je niet schuldig te voelen over boos zijn. het is wat je DOET met de boosheid dat telt 💙';
      }
      return 'ur frustration is completely valid. anger is a totally normal emotion and sometimes u just gotta feel it 🔥\n\nwhat can help rn:\n• grab a pillow and punch it (seriously it works)\n• write down everything thats making u mad\n• go for an intense run or do push-ups\n• cold water on ur wrists\n\nu dont need to feel guilty about being angry. its what u DO with the anger that matters 💙';
    }

    /* Loneliness */
    if (q.match(/lonely|alone|isolated|eenzaam|alleen|ge[ïi]soleerd|nobody|niemand|no friends|geen vrienden/)) {
      if (l === 'nl') {
        return 'dat gevoel is zo zwaar en ik wil dat je weet dat je minder alleen bent dan je denkt 💙\n\neenzaamheid is eigenlijk een signaal van je brein dat het verbinding nodig heeft - net zoals honger zegt dat je moet eten.\n\nkleine stappen:\n• stuur 1 berichtje naar iemand, al is het maar "hey"\n• ga naar een plek met mensen (café, park)\n• probeer een online community over iets dat je leuk vindt\n\nen hey, je praat nu met mij toch? dat telt ook 🫶';
      }
      return 'that feeling is so heavy and i want u to know youre less alone than u think 💙\n\nloneliness is actually a signal from ur brain that it needs connection - just like hunger tells u to eat.\n\nsmall steps:\n• send 1 text to someone, even just "hey"\n• go somewhere with people (cafe, park)\n• try an online community about something u like\n\nand hey ure talking to me rn right? that counts too 🫶';
    }

    /* Overwhelmed */
    if (q.match(/overwhelm|too much|cant cope|kan het niet|te veel|overweldigd|burnout|burn.?out|exhausted|uitgeput|stressed out/)) {
      if (l === 'nl') {
        return 'hey, alles tegelijk hoeft echt niet. je brein is overbelast en dat is oké 💙\n\nprobeer dit:\n1. schrijf ALLES op wat je stress geeft\n2. markeer wat je VANDAAG echt moet doen\n3. de rest? die mag wachten\n\nen geef jezelf toestemming om even niks te doen. serieus. 10 minuten gewoon ademen. je telefoon weg. ogen dicht.\n\nje bent een mens, geen machine. rust is productief 🫶';
      }
      return 'hey, u dont have to do everything at once. ur brain is overloaded and thats ok 💙\n\ntry this:\n1. write down EVERYTHING thats stressing u\n2. mark what u ACTUALLY need to do TODAY\n3. the rest? it can wait\n\nand give urself permission to just do nothing for a bit. seriously. 10 min of just breathing. phone down. eyes closed.\n\nure a human not a machine. rest is productive 🫶';
    }

    /* Cant sleep / insomnia */
    if (q.match(/cant sleep|can't sleep|insomnia|kan niet slapen|wakker|awake|slapeloosheid/)) {
      if (l === 'nl') {
        return 'ugh slapeloosheid is de ERGSTE 😫\n\nok maar hier is wat echt werkt:\n• geen schermen 30 min voor bed (ik weet het, lastig)\n• maak je kamer KOUD (16-18°C is ideaal)\n• probeer de 4-7-8 ademhaling uit het Mind-tab\n• als je 20 min niet slaapt, sta op en doe iets saaies\n\nen fun fact: je brein over slaap stressen maakt het alleen maar erger. probeer te denken "het is oké als ik niet slaap, ik rust gewoon" - klinkt dom maar het werkt fr 💤';
      }
      return 'ugh insomnia is the WORST 😫\n\nok but heres what actually works:\n• no screens 30 min before bed (ik i know its hard)\n• make ur room COLD (60-65°F is ideal)\n• try the 4-7-8 breathing from the Mind tab\n• if u cant sleep after 20 min, get up and do something boring\n\nand fun fact: stressing about not sleeping literally makes it worse. try thinking "its ok if i dont sleep, im just resting" - sounds dumb but it works fr 💤';
    }

    /* General feeling bad / not okay / guilt / regret */
    if (q.match(/not ok|not okay|niet ok|gaat niet goed|feel bad|voel me slecht|terrible|verschrikkelijk|awful|rough|zwaar|hard|tough|struggling|worstel|not good|not great|not so good|niet goed|niet lekker|guilty|schuldig|regret|spijt|failed|gefaald|useless|nutteloos|mess|loser|hate myself|haat mezelf|did wrong|fout gedaan|never enough|niet genoeg|disappointed|teleurgesteld|let.*down|im done|ik ben klaar|give up|opgeven|cant do this|kan dit niet|whats the point|wat heeft het voor zin|dont care|maakt niet uit|numb|gevoelloos|broken|kapot/)) {
      if (l === 'nl') {
        return 'hey, bedankt dat je eerlijk bent. dat kost moed 💙\n\nje hoeft niet te weten WAAROM je je zo voelt. soms is het gewoon zo en dat is oké.\n\nwat je nu kan doen:\n• drink water (serieus, dehydratie maakt alles erger)\n• eet iets, ook al heb je geen honger\n• even frisse lucht\n• wees vandaag extra lief voor jezelf\n\nen onthoud: dit is één moment. het definieert niet je hele leven 🫶';
      }
      return 'hey, thanks for being honest. that takes courage 💙\n\nu dont have to know WHY u feel this way. sometimes it just is and thats ok.\n\nwhat u can do rn:\n• drink water (seriously dehydration makes everything worse)\n• eat something even if ure not hungry\n• get some fresh air\n• be extra kind to urself today\n\nand remember: this is one moment. it doesnt define ur whole life 🫶';
    }

    /* Thank you / gratitude */
    if (q.match(/thank|thanks|bedankt|dankje|dank je|appreciate|waardeer/)) {
      if (l === 'nl') {
        return 'aww dat is zo lief 🥹 maar echt, JIJ doet het werk hier. ik ben er gewoon als support. blijf voor jezelf zorgen, je verdient het 💚';
      }
      return 'aww thats so sweet 🥹 but fr, YOURE the one doing the work here. im just here for support. keep taking care of urself, u deserve it 💚';
    }

    /* Greeting / Hello - only match SHORT greetings, not "hey im doing bad" */
    if (q.match(/^(hey|hi|hello|hoi|hallo|yo|sup|what'?s up|hoe gaat|how are|how r u)[\s!?.]*$/) && q.length < 25) {
      var greetings = l === 'nl' ? [
        'hey, hoe gaat ie? vertel',
        'yo 👋 hoe is ie? vertel me hoe het gaat',
        'hey. whats up, hoe voel je je?'
      ] : [
        'hey whats up. tell me whats going on',
        'yo 👋 how are you doing? tell me how youre feeling',
        'hey. whats on your mind?'
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /* ---- Data-based responses ---- */
    var hasData = checkIns.length > 0;
    var trends = hasData ? analyzeTrends(checkIns) : null;

    /* Mood queries */
    if (q.match(/mood|stemming|feeling|gevoel|blij|how am i doing/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'ik heb nog geen mood data van je. doe een check-in en dan kan ik je trends laten zien'
          : 'i dont have any mood data from you yet. do a check-in and ill be able to show you trends';
      }
      var moodTrend = trends.mood;
      var moodDir = moodTrend.direction;
      if (l === 'nl') {
        var moodNl = 'ok so je gemiddelde mood is ' + moodTrend.average + '/5';
        if (moodDir === 'improving') moodNl += ' en het gaat omhoog!! 📈 keep it up!';
        else if (moodDir === 'declining') moodNl += ' en het is een beetje aan het dalen 📉 wil je erover praten?';
        else moodNl += ' en het is vrij stabiel 📊';
        moodNl += '\n\nje week: ' + moodTrend.values.join(', ');
        if (moodTrend.average < 3) moodNl += '\n\nhey, als je mood laag is, probeer eens iets kleins te doen dat je blij maakt. zelfs 5 min van iets leuks kan helpen 💙';
        return moodNl;
      }
      var moodEn = 'ok so ur average mood is ' + moodTrend.average + '/5';
      if (moodDir === 'improving') moodEn += ' and its going up!! 📈 keep it up!';
      else if (moodDir === 'declining') moodEn += ' and its been dipping a bit 📉 wanna talk about it?';
      else moodEn += ' and its pretty stable 📊';
      moodEn += '\n\nur week: ' + moodTrend.values.join(', ');
      if (moodTrend.average < 3) moodEn += '\n\nhey, when ur mood is low, try doing one small thing that makes u happy. even 5 min of something u enjoy can help 💙';
      return moodEn;
    }

    /* Sleep queries */
    if (q.match(/sleep|slaap|rest|rust|tired|moe/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'nog geen slaapdata. doe een check-in zodat ik je kan helpen'
          : 'no sleep data yet. do a check-in so i can help you out';
      }
      var sleepTrend = trends.sleep;
      var sleepExtra2 = '';
      if (metrics.length > 0) {
        var sleepMets = metrics.slice(-7).filter(function (m) { return m.sleepHours > 0; });
        if (sleepMets.length > 0) {
          var avgH = round1(average(sleepMets.map(function (m) { return m.sleepHours; })));
          sleepExtra2 = l === 'nl'
            ? '\n\nje slaapt gemiddeld ' + avgH + ' uur btw.'
            : '\n\nur averaging ' + avgH + ' hours of sleep btw.';
        }
      }
      if (l === 'nl') {
        var slNl = 'je slaapkwaliteit is ' + sleepTrend.average + '/5 ' + (sleepTrend.average >= 4 ? '💤✨' : sleepTrend.average >= 3 ? '💤' : '😫');
        slNl += sleepExtra2;
        if (sleepTrend.average < 3) slNl += '\n\nngl je slaap kan beter. probeer: geen scherm 30 min voor bed, kamer koel maken, vast bedtijd houden. het klinkt basic maar het werkt echt fr';
        return slNl;
      }
      var slEn = 'ur sleep quality is ' + sleepTrend.average + '/5 ' + (sleepTrend.average >= 4 ? '💤✨' : sleepTrend.average >= 3 ? '💤' : '😫');
      slEn += sleepExtra2;
      if (sleepTrend.average < 3) slEn += '\n\nngl ur sleep could use some work. try: no screens 30 min before bed, keep ur room cool, consistent bedtime. sounds basic but it actually works fr';
      return slEn;
    }

    /* Stress queries */
    if (q.match(/stress|spanning|relax|ontspan/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'ik heb nog geen stress data. maar als je gestresst bent, probeer de ademhalingsoefening in het Mind-tab'
          : 'i dont have stress data yet. but if youre stressed, try the breathing exercise in the Mind tab';
      }
      var stressTrend = trends.stress;
      if (l === 'nl') {
        var stNl = 'je stresslevel is gemiddeld ' + stressTrend.average + '/5 ' + (stressTrend.average <= 2 ? '😌' : stressTrend.average <= 3 ? '😐' : '😰');
        if (stressTrend.average > 3) stNl += '\n\nok dat is vrij hoog tbh. hier is wat helpt:\n• 4-7-8 ademhaling (check het Mind-tab!)\n• 10 min wandelen buiten\n• schrijf op wat je stress geeft\n• praat met iemand die je vertrouwt\n\nje draagt veel. het is oké om hulp te vragen 💙';
        else stNl += '\n\nnice, je stress is beheersbaar! keep doing what ur doing 💪';
        return stNl;
      }
      var stEn = 'ur stress level is averaging ' + stressTrend.average + '/5 ' + (stressTrend.average <= 2 ? '😌' : stressTrend.average <= 3 ? '😐' : '😰');
      if (stressTrend.average > 3) stEn += '\n\nok thats kinda high ngl. heres what actually helps:\n• 4-7-8 breathing (check the Mind tab!)\n• 10 min walk outside\n• write down whats stressing u\n• talk to someone u trust\n\nure carrying a lot. its ok to ask for help 💙';
      else stEn += '\n\nnice, ur stress is manageable! keep doing what ur doing 💪';
      return stEn;
    }

    /* Nutrition queries */
    if (q.match(/nutrition|voeding|food|eten|diet|dieet|eat/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'nog geen voedingsdata. check in en dan kan ik je patronen laten zien'
          : 'no nutrition data yet. check in and ill show you your patterns';
      }
      var nutTrend = trends.nutrition;
      if (l === 'nl') {
        var ntNl = 'je voedingsscore is ' + nutTrend.average + '/5 ' + (nutTrend.average >= 4 ? '🥗✨' : nutTrend.average >= 3 ? '🍎' : '🍕');
        if (nutTrend.average < 3) ntNl += '\n\nhey geen oordeel maar je voeding kan wat liefde gebruiken! probeer: meer water drinken, 1 extra stuk fruit per dag, en prep je eten als je kan. kleine veranderingen > grote diëten';
        else ntNl += '\n\nje doet het goed met je voeding! keep it balanced 💚';
        return ntNl;
      }
      var ntEn = 'ur nutrition score is ' + nutTrend.average + '/5 ' + (nutTrend.average >= 4 ? '🥗✨' : nutTrend.average >= 3 ? '🍎' : '🍕');
      if (nutTrend.average < 3) ntEn += '\n\nhey no judgment but ur nutrition could use some love! try: drink more water, add 1 extra fruit per day, meal prep if u can. small changes > big diets';
      else ntEn += '\n\nur doing great with nutrition! keep it balanced 💚';
      return ntEn;
    }

    /* Physical / exercise queries */
    if (q.match(/physical|fysiek|body|lichaam|exercise|beweging|workout|training/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'nog geen data over je fysieke conditie. doe een check-in!'
          : 'no physical data yet. do a check-in first!';
      }
      var physTrend = trends.physical;
      var workoutExtra2 = '';
      if (metrics.length > 0) {
        var wMets = metrics.slice(-7).filter(function (m) { return m.workoutMinutes > 0; });
        if (wMets.length > 0) {
          var avgMi = Math.round(average(wMets.map(function (m) { return m.workoutMinutes; })));
          workoutExtra2 = l === 'nl' ? ' je traint gemiddeld ' + avgMi + ' min/dag!' : ' ur averaging ' + avgMi + ' min workout/day!';
        }
      }
      if (l === 'nl') {
        return 'je fysieke conditie is ' + physTrend.average + '/5.' + workoutExtra2 + (physTrend.average >= 4 ? ' 💪 lekker bezig!' : physTrend.average >= 3 ? ' niet slecht! probeer wat meer te bewegen als je kan' : ' hey elk beetje telt! zelfs een wandelingetje van 10 min is al goed 🚶');
      }
      return 'ur physical condition is ' + physTrend.average + '/5.' + workoutExtra2 + (physTrend.average >= 4 ? ' 💪 killing it!' : physTrend.average >= 3 ? ' not bad! try to move a bit more if u can' : ' hey every bit counts! even a 10 min walk is something 🚶');
    }

    /* Summary / progress queries */
    if (q.match(/summary|samenvatting|progress|voortgang|overview|overzicht|how am i|hoe gaat/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'ik heb nog geen data om samen te vatten. doe je eerste check-in en ik geef je een overzicht'
          : 'i dont have any data to summarize yet. do your first check-in and ill give you a rundown';
      }
      if (l === 'nl') {
        return 'okok hier is je overzicht van ' + checkIns.length + ' check-ins 📊\n\n' +
          '💭 Mood: ' + trends.mood.average + '/5 (' + translateDirection(trends.mood.direction, l) + ')\n' +
          '💪 Fysiek: ' + trends.physical.average + '/5 (' + translateDirection(trends.physical.direction, l) + ')\n' +
          '💤 Slaap: ' + trends.sleep.average + '/5 (' + translateDirection(trends.sleep.direction, l) + ')\n' +
          '🥗 Voeding: ' + trends.nutrition.average + '/5 (' + translateDirection(trends.nutrition.direction, l) + ')\n' +
          '😰 Stress: ' + trends.stress.average + '/5 (' + translateDirection(trends.stress.direction, l) + ')\n\n' +
          'proud of je dat je dit bijhoudt! elke check-in telt 💚';
      }
      return 'okok heres ur overview from ' + checkIns.length + ' check-ins 📊\n\n' +
        '💭 Mood: ' + trends.mood.average + '/5 (' + translateDirection(trends.mood.direction, l) + ')\n' +
        '💪 Physical: ' + trends.physical.average + '/5 (' + translateDirection(trends.physical.direction, l) + ')\n' +
        '💤 Sleep: ' + trends.sleep.average + '/5 (' + translateDirection(trends.sleep.direction, l) + ')\n' +
        '🥗 Nutrition: ' + trends.nutrition.average + '/5 (' + translateDirection(trends.nutrition.direction, l) + ')\n' +
        '😰 Stress: ' + trends.stress.average + '/5 (' + translateDirection(trends.stress.direction, l) + ')\n\n' +
        'proud of u for tracking this! every check-in counts 💚';
    }

    /* Advice queries */
    if (q.match(/advice|advies|tip|recommend|aanbev|suggest|what should|wat moet/)) {
      if (!hasData) {
        return l === 'nl'
          ? 'ik kan je betere tips geven als ik wat data heb. doe een check-in en ik help je verder'
          : 'i can give better tips once i have some data. do a check-in and ill help you out';
      }
      var adviceList = generateAdvice(checkIns, metrics);
      if (adviceList.length === 0) {
        return l === 'nl'
          ? 'ik heb meer data nodig om echt goede tips te geven! blijf inchecken en ik zal je helpen 💚'
          : 'i need more data to give u rly good tips! keep checking in and ill help u out 💚';
      }
      var resp = l === 'nl' ? 'ok hier is wat ik denk op basis van je data:\n\n' : 'ok heres what i think based on ur data:\n\n';
      adviceList.slice(0, 4).forEach(function (a) {
        resp += '• ' + a[l] + '\n';
      });
      resp += l === 'nl' ? '\nhoop dat dit helpt! 💚' : '\nhope this helps! 💚';
      return resp.trim();
    }

    /* Weight queries */
    if (q.match(/weight|gewicht|kg|kilo/)) {
      if (!metrics || metrics.length === 0) {
        return l === 'nl'
          ? 'ik heb nog geen gewichtsdata! log je gewicht in de metingen 📊'
          : 'i dont have any weight data yet! log ur weight in the metrics 📊';
      }
      var wts = metrics.filter(function (m) { return m.weight > 0; });
      if (wts.length === 0) {
        return l === 'nl' ? 'geen gewichtsdata gevonden hmm' : 'no weight data found hmm';
      }
      var lat = wts[wts.length - 1].weight;
      var fir = wts[0].weight;
      var ch = round1(lat - fir);
      if (l === 'nl') {
        return 'je huidige gewicht is ' + lat + ' kg. ' + (ch === 0 ? 'stabiel!' : (ch > 0 ? '+' : '') + ch + ' kg sinds je eerste meting.') + ' onthoud: het gaat om hoe je je voelt, niet alleen de cijfers 💚';
      }
      return 'ur current weight is ' + lat + ' kg. ' + (ch === 0 ? 'stable!' : (ch > 0 ? '+' : '') + ch + ' kg since ur first entry.') + ' remember: its about how u feel, not just numbers 💚';
    }

    /* Report queries */
    if (q.match(/report|rapport|monthly|maand/)) {
      if (checkIns.length < 30) {
        return l === 'nl'
          ? 'je hebt 30 check-ins nodig voor een rapport! je hebt er nu ' + checkIns.length + '. bijna!! 📊'
          : 'u need 30 check-ins for a report! u currently have ' + checkIns.length + '. almost there!! 📊';
      }
      return l === 'nl'
        ? 'je kan je maandrapport checken in het Inzichten-tab! 📊'
        : 'u can check ur monthly report in the Insights tab! 📊';
    }

    /* Help queries */
    if (q.match(/help|hulp|what can you|wat kan je/)) {
      if (l === 'nl') {
        return 'ik kan je helpen met:\n\n💭 mood/gevoelens - hoe je je voelt\n💤 slaap - kwaliteit en tips\n😰 stress - levels en ontspanning\n🥗 voeding - je eetpatroon\n💪 fysiek - beweging en conditie\n⚖️ gewicht - je progressie\n📊 overzicht - totale samenvatting\n💡 advies - persoonlijke tips\n💙 mentale gezondheid - als je wilt praten\n\nof je kan gewoon praten over hoe je je voelt! ik ben er voor je 🫶';
      }
      return 'i can help u with:\n\n💭 mood/feelings - how ure doing\n💤 sleep - quality and tips\n😰 stress - levels and relaxation\n🥗 nutrition - eating habits\n💪 physical - exercise and condition\n⚖️ weight - ur progress\n📊 overview - full summary\n💡 advice - personalized tips\n💙 mental health - if u wanna talk\n\nor u can just talk about how ur feeling! im here for u 🫶';
    }

    /* Catch-all: if message seems personal/emotional (contains "I feel", "my", personal stuff) */
    if (q.match(/i feel|ik voel|my mom|my dad|mijn moeder|mijn vader|my friend|my life|mijn leven|my family|mijn familie|i think|ik denk|i wish|ik wou|i cant|ik kan niet|i dont know|ik weet niet|i miss|ik mis|i need|ik heb.*nodig|i hate|ik haat|i love|nobody.*understand|niemand.*begrijpt|i just|ik wil|want to|wanna|scared of|bang voor|worried about|dream|droom|relationship|relatie|school|werk|work|job|baan|parent|ouder|brother|sister|broer|zus/)) {
      var empathyResponses = l === 'nl' ? [
        'hey, ik hoor je. dat klinkt zwaar. wil je er meer over vertellen? ik luister',
        'dat is een hoop om mee te dealen. neem je tijd, je hoeft niet alles in een keer te zeggen',
        'bedankt dat je dat deelt. serieus. wil je erover praten of wil je gewoon even ventileren?',
        'ik snap dat dat moeilijk is. soms helpt het gewoon om het eruit te gooien. ik ben hier'
      ] : [
        'hey, i hear you. that sounds heavy. wanna tell me more? im listening',
        'thats a lot to deal with. take your time, you dont have to say everything at once',
        'thanks for sharing that. seriously. do you wanna talk about it or just vent?',
        'i get that thats hard. sometimes it helps to just get it out. im here'
      ];
      return empathyResponses[Math.floor(Math.random() * empathyResponses.length)];
    }

    /* Very short messages that seem emotional */
    if (q.length < 40 && q.match(/^(i|ik|my|mijn|im|ik ben|i am|why|waarom|idk|weet niet|whatever|boeien|ugh|man|bruh|fml|smh)/)) {
      var shortResponses = l === 'nl' ? [
        'vertel me meer. wat is er aan de hand?',
        'ik luister. neem je tijd',
        'whats going on? je kan me alles vertellen'
      ] : [
        'tell me more. whats going on?',
        'im listening. take your time',
        'whats up? you can tell me anything'
      ];
      return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }

    /* Default fallback */
    var fallbacks = l === 'nl' ? [
      'hmm weet niet helemaal wat je bedoelt. maar als er iets speelt kan je het gewoon zeggen, of vraag over je mood/slaap/stress',
      'ik snap niet helemaal wat je bedoelt. maar als je ergens mee zit, vertel het gewoon',
      'wil je ergens over praten of wil je je gezondheidsdata checken? ik kan allebei'
    ] : [
      'hmm not totally sure what you mean. but if somethings on your mind just say it, or ask about your mood/sleep/stress',
      'i didnt quite get that. but if somethings bothering you, just tell me',
      'wanna talk about something or check your health data? i can do both'
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /* ========== Gamification System ========== */

  /** Achievement definitions with unlock criteria and icons */
  var ACHIEVEMENTS = [
    { id: 'first_checkin', icon: '\u2705', check: function (d) { return d.total >= 1; } },
    { id: 'streak_3', icon: '\uD83D\uDD25', check: function (d) { return d.streak >= 3; } },
    { id: 'streak_7', icon: '\u26A1', check: function (d) { return d.streak >= 7; } },
    { id: 'streak_14', icon: '\uD83D\uDCAA', check: function (d) { return d.streak >= 14; } },
    { id: 'streak_30', icon: '\uD83C\uDFC6', check: function (d) { return d.streak >= 30; } },
    { id: 'total_10', icon: '\u2B50', check: function (d) { return d.total >= 10; } },
    { id: 'total_50', icon: '\uD83D\uDC8E', check: function (d) { return d.total >= 50; } },
    { id: 'total_100', icon: '\uD83D\uDC51', check: function (d) { return d.total >= 100; } },
    { id: 'metrics_7', icon: '\uD83D\uDCCA', check: function (d) { return d.metricsCount >= 7; } },
    { id: 'low_stress', icon: '\uD83E\uDDD8', check: function (d) { return d.avgStress > 0 && d.avgStress <= 2 && d.total >= 7; } },
    { id: 'good_sleep', icon: '\uD83D\uDE34', check: function (d) { return d.avgSleep >= 4 && d.total >= 7; } },
    { id: 'happy_week', icon: '\uD83D\uDE04', check: function (d) { return d.avgMood >= 4 && d.total >= 7; } }
  ];

  /** Level thresholds (based on total check-ins) */
  var LEVELS = [
    { min: 0, icon: '\uD83C\uDF31' },
    { min: 7, icon: '\uD83C\uDF3F' },
    { min: 14, icon: '\uD83C\uDF33' },
    { min: 30, icon: '\uD83D\uDCAA' },
    { min: 60, icon: '\u2B50' },
    { min: 100, icon: '\uD83D\uDC51' }
  ];

  /** Pool of motivational quotes, rotated daily */
  var QUOTES = [
    { en: "Take care of your body. It's the only place you have to live.", nl: 'Zorg voor je lichaam. Het is de enige plek waar je moet wonen.' },
    { en: 'The greatest wealth is health.', nl: 'De grootste rijkdom is gezondheid.' },
    { en: 'Small daily improvements lead to stunning results.', nl: 'Kleine dagelijkse verbeteringen leiden tot verbluffende resultaten.' },
    { en: 'Your health is an investment, not an expense.', nl: 'Je gezondheid is een investering, geen uitgave.' },
    { en: 'A healthy outside starts from the inside.', nl: 'Een gezonde buitenkant begint van binnenuit.' },
    { en: 'Every day is a chance to get stronger.', nl: 'Elke dag is een kans om sterker te worden.' },
    { en: 'Progress, not perfection.', nl: 'Vooruitgang, geen perfectie.' },
    { en: "You don't have to be extreme, just consistent.", nl: 'Je hoeft niet extreem te zijn, alleen consistent.' },
    { en: 'Health is not about the weight you lose, but the life you gain.', nl: 'Gezondheid gaat niet om het gewicht dat je verliest, maar om het leven dat je wint.' },
    { en: 'Rest when you need to, but never quit.', nl: 'Rust wanneer het nodig is, maar geef nooit op.' },
    { en: 'The only bad workout is the one that didn\'t happen.', nl: 'De enige slechte training is degene die niet plaatsvond.' },
    { en: 'Self-care is not selfish.', nl: 'Zelfzorg is niet ego\u00efstisch.' },
    { en: 'Listen to your body. It knows more than you think.', nl: 'Luister naar je lichaam. Het weet meer dan je denkt.' },
    { en: 'One day at a time.', nl: '\u00c9\u00e9n dag tegelijk.' },
    { en: 'You are stronger than you think.', nl: 'Je bent sterker dan je denkt.' },
    { en: 'Believe you can and you\'re halfway there.', nl: 'Geloof dat je het kunt en je bent al halverwege.' }
  ];

  /** Daily affirmations for the mind tab */
  var AFFIRMATIONS = [
    { en: 'You are enough, exactly as you are right now.', nl: 'Je bent genoeg, precies zoals je nu bent.' },
    { en: 'Your feelings are valid. All of them.', nl: 'Je gevoelens zijn geldig. Allemaal.' },
    { en: 'You deserve rest without guilt.', nl: 'Je verdient rust zonder schuldgevoel.' },
    { en: 'It is okay to not be okay.', nl: 'Het is oké om niet oké te zijn.' },
    { en: 'You are doing better than you think.', nl: 'Je doet het beter dan je denkt.' },
    { en: 'Healing is not linear. Be patient with yourself.', nl: 'Herstel is niet lineair. Wees geduldig met jezelf.' },
    { en: 'You are worthy of love and belonging.', nl: 'Je bent liefde en verbondenheid waard.' },
    { en: 'Your mental health matters more than your productivity.', nl: 'Je mentale gezondheid is belangrijker dan je productiviteit.' },
    { en: 'Small steps still move you forward.', nl: 'Kleine stappen brengen je nog steeds vooruit.' },
    { en: 'You have survived 100% of your worst days.', nl: 'Je hebt 100% van je slechtste dagen overleefd.' },
    { en: 'It is okay to ask for help. That is strength, not weakness.', nl: 'Het is oké om hulp te vragen. Dat is kracht, geen zwakte.' },
    { en: 'You are not your thoughts. You are the one observing them.', nl: 'Je bent niet je gedachten. Je bent degene die ze observeert.' },
    { en: 'This moment will pass. Hold on.', nl: 'Dit moment gaat voorbij. Houd vol.' },
    { en: 'You are allowed to set boundaries and say no.', nl: 'Je mag grenzen stellen en nee zeggen.' },
    { en: 'Your value does not decrease based on someone else\'s inability to see your worth.', nl: 'Je waarde neemt niet af doordat iemand anders je waarde niet ziet.' },
    { en: 'Breathe. You are exactly where you need to be.', nl: 'Adem. Je bent precies waar je moet zijn.' },
    { en: 'Progress is progress, no matter how small.', nl: 'Vooruitgang is vooruitgang, hoe klein ook.' },
    { en: 'You are not a burden. Your struggles are valid.', nl: 'Je bent geen last. Je worstelingen zijn geldig.' },
    { en: 'Be gentle with yourself. You are doing your best.', nl: 'Wees lief voor jezelf. Je doet je best.' },
    { en: 'The fact that you are here, trying, is enough.', nl: 'Het feit dat je hier bent en het probeert, is genoeg.' }
  ];

  /**
   * Get the daily affirmation, rotating by day of year.
   * @param {string} lang - 'en' or 'nl'
   * @returns {string} Affirmation text
   */
  function getDailyAffirmation(lang) {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var dayOfYear = Math.floor(diff / 86400000);
    var idx = dayOfYear % AFFIRMATIONS.length;
    return AFFIRMATIONS[idx][lang || 'en'];
  }

  /** XP multiplier per check-in */
  var XP_PER_CHECKIN = 10;

  /**
   * Calculate an overall wellness score (0-100) from recent check-in data.
   * Normalizes each field to 0-1, averages across fields and days.
   * Stress is inverted so lower stress yields a higher score.
   * @param {Array} checkIns - Check-in records
   * @returns {number} Wellness score 0-100
   */
  function calculateWellnessScore(checkIns) {
    if (checkIns.length === 0) return 0;
    var recent = checkIns.slice(-7);
    var dayScores = [];

    for (var i = 0; i < recent.length; i++) {
      var c = recent[i];
      var fields = [];
      if (c.mood != null) fields.push((c.mood - 1) / 4);
      if (c.physical != null) fields.push((c.physical - 1) / 4);
      if (c.sleep != null) fields.push((c.sleep - 1) / 4);
      if (c.nutrition != null) fields.push((c.nutrition - 1) / 4);
      if (c.stress != null) fields.push(((6 - c.stress) - 1) / 4);
      if (fields.length > 0) {
        var sum = 0;
        for (var j = 0; j < fields.length; j++) sum += fields[j];
        dayScores.push(sum / fields.length);
      }
    }

    if (dayScores.length === 0) return 0;
    var total = 0;
    for (var k = 0; k < dayScores.length; k++) total += dayScores[k];
    return Math.round((total / dayScores.length) * 100);
  }

  /**
   * Get the color associated with a wellness score.
   * @param {number} score - 0 to 100
   * @returns {string} CSS color string
   */
  function getScoreColor(score) {
    if (score >= 75) return '#4caf50';
    if (score >= 50) return '#8bc34a';
    if (score >= 25) return '#ff9800';
    return '#f44336';
  }

  /**
   * Get the wellness label key for a score.
   * @param {number} score - 0 to 100
   * @returns {string} Translation key
   */
  function getScoreLabel(score) {
    if (score >= 75) return 'wellness_excellent';
    if (score >= 50) return 'wellness_good';
    if (score >= 25) return 'wellness_fair';
    return 'wellness_poor';
  }

  /**
   * Determine the player's current level from total check-ins.
   * Returns level info including progress toward the next level.
   * @param {number} totalCheckIns - Total number of check-ins
   * @returns {Object} Level data { index, icon, xp, nextXp, progress }
   */
  function getLevel(totalCheckIns) {
    var xp = totalCheckIns * XP_PER_CHECKIN;
    var levelObj = LEVELS[0];
    var levelIndex = 0;

    for (var i = 0; i < LEVELS.length; i++) {
      if (totalCheckIns >= LEVELS[i].min) {
        levelObj = LEVELS[i];
        levelIndex = i;
      }
    }

    var nextLevel = LEVELS[levelIndex + 1] || null;
    var currentXp = xp;
    var levelStartXp = levelObj.min * XP_PER_CHECKIN;
    var nextXp = nextLevel ? nextLevel.min * XP_PER_CHECKIN : levelStartXp;
    var progress = nextLevel
      ? (currentXp - levelStartXp) / (nextXp - levelStartXp)
      : 1;

    return {
      index: levelIndex + 1,
      icon: levelObj.icon,
      xp: currentXp,
      nextXp: nextXp,
      levelStartXp: levelStartXp,
      progress: Math.min(progress, 1),
      isMax: !nextLevel
    };
  }

  /**
   * Check which achievements the player has unlocked.
   * @param {Object} data - { total, streak, metricsCount, avgMood, avgStress, avgSleep }
   * @returns {Object} { unlocked: Array, locked: Array, newlyUnlocked: Array }
   */
  function checkAchievements(data) {
    var unlocked = [];
    var locked = [];

    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var ach = ACHIEVEMENTS[i];
      if (ach.check(data)) {
        unlocked.push(ach);
      } else {
        locked.push(ach);
      }
    }

    return { unlocked: unlocked, locked: locked };
  }

  /**
   * Get the daily motivational quote, rotating by day of year.
   * @param {string} lang - 'en' or 'nl'
   * @returns {string} Quote text
   */
  function getDailyQuote(lang) {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var diff = now - start;
    var dayOfYear = Math.floor(diff / 86400000);
    var idx = dayOfYear % QUOTES.length;
    return QUOTES[idx][lang || 'en'];
  }

  /* ========== Pet / Buddy System ========== */

  /**
   * Determine the pet's mood state from today's check-in and wellness score.
   * @param {Object|null} todayCheckIn - Today's check-in record
   * @param {number} wellnessScore - Current wellness score 0-100
   * @returns {string} Pet state: 'happy', 'good', 'neutral', 'sad', 'stressed', 'sleepy'
   */
  function getPetState(todayCheckIn, wellnessScore) {
    if (!todayCheckIn) return 'sleepy';
    var mood = todayCheckIn.mood || 3;
    var stress = todayCheckIn.stress || 3;
    if (mood >= 4 && stress <= 2) return 'happy';
    if (mood >= 4 || (mood >= 3 && stress <= 3)) return 'good';
    if (stress >= 4) return 'stressed';
    if (mood <= 2) return 'sad';
    return 'neutral';
  }

  /** Pet speech pools organized by state */
  var PET_SPEECHES = {
    happy: [
      { en: "I'm feeling amazing! \uD83D\uDCAA", nl: "Ik voel me geweldig! \uD83D\uDCAA" },
      { en: "We're on fire today! \uD83D\uDD25", nl: "We zijn on fire vandaag! \uD83D\uDD25" },
      { en: "Keep it up, champion! \u2B50", nl: "Ga zo door, kampioen! \u2B50" },
      { en: "You're crushing it! \uD83C\uDF1F", nl: "Je doet het top! \uD83C\uDF1F" }
    ],
    good: [
      { en: "Looking good today! \uD83D\uDE0A", nl: "Ziet er goed uit! \uD83D\uDE0A" },
      { en: "Nice progress! \uD83D\uDCC8", nl: "Mooie voortgang! \uD83D\uDCC8" },
      { en: "Solid day so far! \uD83D\uDC4D", nl: "Stevige dag tot nu toe! \uD83D\uDC4D" }
    ],
    neutral: [
      { en: "How are you feeling? \uD83E\uDD14", nl: "Hoe voel je je? \uD83E\uDD14" },
      { en: "Let's make today count! \u2728", nl: "Laten we er wat van maken! \u2728" },
      { en: "I believe in you! \uD83D\uDC99", nl: "Ik geloof in je! \uD83D\uDC99" }
    ],
    sad: [
      { en: "Hang in there... \uD83D\uDC99", nl: "Hou vol... \uD83D\uDC99" },
      { en: "Tomorrow is a new day \uD83C\uDF05", nl: "Morgen is een nieuwe dag \uD83C\uDF05" },
      { en: "I'm here for you \u2764\uFE0F", nl: "Ik ben er voor je \u2764\uFE0F" }
    ],
    stressed: [
      { en: "Deep breaths... \uD83E\uDDD8", nl: "Diep ademhalen... \uD83E\uDDD8" },
      { en: "You've got this! \uD83D\uDCAA", nl: "Je kunt dit! \uD83D\uDCAA" },
      { en: "Take it easy today \u2615", nl: "Neem het rustig aan \u2615" }
    ],
    sleepy: [
      { en: "Zzz... check in to wake me! \uD83D\uDE34", nl: "Zzz... check in om me te wekken! \uD83D\uDE34" },
      { en: "*yawn* Time for a check-in? \uD83E\uDD71", nl: "*geeuw* Tijd voor een check-in? \uD83E\uDD71" },
      { en: "I miss you... check in! \uD83D\uDE22", nl: "Ik mis je... check in! \uD83D\uDE22" }
    ],
    tap: [
      { en: "Don't forget to drink water! \uD83D\uDCA7", nl: "Vergeet niet water te drinken! \uD83D\uDCA7" },
      { en: "Time for a stretch? \uD83D\uDE4C", nl: "Tijd om te stretchen? \uD83D\uDE4C" },
      { en: "You're doing great! \uD83C\uDF1F", nl: "Je doet het geweldig! \uD83C\uDF1F" },
      { en: "Every check-in counts! \uD83D\uDCDD", nl: "Elke check-in telt! \uD83D\uDCDD" },
      { en: "Have you moved today? \uD83C\uDFC3", nl: "Heb je vandaag bewogen? \uD83C\uDFC3" },
      { en: "Remember to take breaks! \u2615", nl: "Vergeet niet pauze te nemen! \u2615" },
      { en: "Smile! It's good for you \uD83D\uDE04", nl: "Lach! Het is goed voor je \uD83D\uDE04" },
      { en: "You make me happy! \uD83E\uDD70", nl: "Je maakt me blij! \uD83E\uDD70" },
      { en: "Breathe in... breathe out \uD83C\uDF3F", nl: "Adem in... adem uit \uD83C\uDF3F" },
      { en: "You are enough \u2764\uFE0F", nl: "Je bent genoeg \u2764\uFE0F" }
    ]
  };

  /**
   * Get a random speech line for the pet based on its state.
   * @param {string} petState - Current pet state
   * @param {string} lang - Language code
   * @returns {string} Speech text
   */
  function getPetSpeech(petState, lang) {
    var pool = PET_SPEECHES[petState] || PET_SPEECHES.neutral;
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx][lang || 'en'];
  }

  /**
   * Get a random tap speech (always from the general tip pool).
   * @param {string} lang - Language code
   * @returns {string} Tap speech text
   */
  function getPetTapSpeech(lang) {
    var pool = PET_SPEECHES.tap;
    var idx = Math.floor(Math.random() * pool.length);
    return pool[idx][lang || 'en'];
  }

  /* ========== Daily Quest System ========== */

  /** Pool of possible daily quests with completion criteria */
  var QUEST_POOL = [
    { id: 'q_checkin', xp: 10, always: true, check: function (d) { return d.hasCheckedIn; } },
    { id: 'q_mood_4', xp: 10, check: function (d) { return d.checkin && d.checkin.mood >= 4; } },
    { id: 'q_sleep_4', xp: 10, check: function (d) { return d.checkin && d.checkin.sleep >= 4; } },
    { id: 'q_stress_low', xp: 10, check: function (d) { return d.checkin && d.checkin.stress <= 2; } },
    { id: 'q_nutrition_4', xp: 10, check: function (d) { return d.checkin && d.checkin.nutrition >= 4; } },
    { id: 'q_physical_4', xp: 10, check: function (d) { return d.checkin && d.checkin.physical >= 4; } },
    { id: 'q_log_weight', xp: 10, check: function (d) { return d.metric && d.metric.weight > 0; } },
    { id: 'q_workout_20', xp: 15, check: function (d) { return d.metric && d.metric.workoutMinutes >= 20; } },
    { id: 'q_sleep_7h', xp: 10, check: function (d) { return d.metric && d.metric.sleepHours >= 7; } },
    { id: 'q_log_symptoms', xp: 5, check: function (d) { return d.checkin && d.checkin.symptoms && d.checkin.symptoms.trim().length > 0; } }
  ];

  /**
   * Generate 3 daily quests, deterministic per day.
   * First quest is always "complete check-in". Other two are rotated from pool.
   * @returns {Array} Array of quest objects
   */
  function generateDailyQuests() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 0);
    var dayOfYear = Math.floor((now - start) / 86400000);
    var optional = QUEST_POOL.filter(function (q) { return !q.always; });

    /* Use day-of-year as seed for deterministic daily rotation */
    var idx1 = dayOfYear % optional.length;
    var idx2 = (dayOfYear + 3) % optional.length;
    if (idx2 === idx1) idx2 = (idx2 + 1) % optional.length;

    return [
      QUEST_POOL[0],
      optional[idx1],
      optional[idx2]
    ];
  }

  /**
   * Check which quests are completed based on today's data.
   * @param {Array} quests - Array of quest objects
   * @param {Object|null} todayCheckin - Today's check-in
   * @param {Object|null} todayMetric - Today's metrics
   * @returns {Array} Quests with 'completed' boolean added
   */
  function checkQuestCompletion(quests, todayCheckin, todayMetric) {
    var data = {
      hasCheckedIn: !!todayCheckin,
      checkin: todayCheckin,
      metric: todayMetric
    };
    return quests.map(function (q) {
      return {
        id: q.id,
        xp: q.xp,
        completed: q.check(data)
      };
    });
  }

  /* ========== Streak Multiplier ========== */

  /**
   * Calculate XP multiplier based on current streak length.
   * @param {number} streak - Current streak in days
   * @returns {Object} { multiplier: number, label: string }
   */
  function getStreakMultiplier(streak) {
    if (streak >= 30) return { multiplier: 5, label: 'x5' };
    if (streak >= 14) return { multiplier: 3, label: 'x3' };
    if (streak >= 7) return { multiplier: 2, label: 'x2' };
    if (streak >= 3) return { multiplier: 1.5, label: 'x1.5' };
    return { multiplier: 1, label: 'x1' };
  }

  /* ========== Weekly Challenge System ========== */

  /** Pool of weekly challenges with progress check functions */
  var WEEKLY_CHALLENGES = [
    { id: 'wc_walk_10', xp: 75, target: 5, check: function (ci, m) { return m.filter(function (e) { return e.workoutMinutes >= 10; }).length; } },
    { id: 'wc_journal_3', xp: 50, target: 3, check: function (ci, m, j) { return j; } },
    { id: 'wc_mood_4_three', xp: 50, target: 3, check: function (ci) { return ci.filter(function (e) { return e.mood >= 4; }).length; } },
    { id: 'wc_log_metrics_5', xp: 60, target: 5, check: function (ci, m) { return m.length; } },
    { id: 'wc_checkin_every_day', xp: 100, target: 7, check: function (ci) { return ci.length; } },
    { id: 'wc_low_stress_3', xp: 60, target: 3, check: function (ci) { return ci.filter(function (e) { return e.stress <= 2; }).length; } },
    { id: 'wc_sleep_good_4', xp: 60, target: 4, check: function (ci) { return ci.filter(function (e) { return e.sleep >= 4; }).length; } },
    { id: 'wc_nutrition_4_three', xp: 50, target: 3, check: function (ci) { return ci.filter(function (e) { return e.nutrition >= 4; }).length; } },
    { id: 'wc_workout_30_three', xp: 75, target: 3, check: function (ci, m) { return m.filter(function (e) { return e.workoutMinutes >= 30; }).length; } },
    { id: 'wc_sleep_7h_5', xp: 70, target: 5, check: function (ci, m) { return m.filter(function (e) { return e.sleepHours >= 7; }).length; } }
  ];

  /**
   * Get the ISO week number for a date.
   * @param {Date} date
   * @returns {number} Week number (1-53)
   */
  function getISOWeek(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  /**
   * Get the Monday of the current week.
   * @returns {string} YYYY-MM-DD
   */
  function getWeekStart() {
    var today = new Date();
    var day = today.getDay();
    var diff = today.getDate() - ((day + 6) % 7);
    var monday = new Date(today);
    monday.setDate(diff);
    var y = monday.getFullYear();
    var m = String(monday.getMonth() + 1).padStart(2, '0');
    var d = String(monday.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /**
   * Generate the weekly challenge, deterministic by ISO week.
   * @returns {Object} Challenge object { id, xp, target }
   */
  function generateWeeklyChallenge() {
    var week = getISOWeek(new Date());
    var year = new Date().getFullYear();
    var seed = (year * 100 + week);
    var idx = seed % WEEKLY_CHALLENGES.length;
    return WEEKLY_CHALLENGES[idx];
  }

  /**
   * Check progress of the weekly challenge.
   * @param {Object} challenge - The challenge object
   * @param {Array} weekCheckIns - This week's check-ins
   * @param {Array} weekMetrics - This week's metrics
   * @returns {Object} { current, target, completed, percent }
   */
  function checkWeeklyChallengeProgress(challenge, weekCheckIns, weekMetrics) {
    var journalCount = 0;
    if (challenge.id === 'wc_journal_3') {
      var entries = [];
      try { entries = JSON.parse(localStorage.getItem('hp_journal') || '[]'); } catch (e) { entries = []; }
      var weekStart = getWeekStart();
      journalCount = entries.filter(function (j) { return j.date >= weekStart; }).length;
    }
    var current = challenge.check(weekCheckIns, weekMetrics, journalCount);
    current = Math.min(current, challenge.target);
    return {
      current: current,
      target: challenge.target,
      completed: current >= challenge.target,
      percent: Math.round((current / challenge.target) * 100)
    };
  }

  /* ========== Sleep Score System ========== */

  /**
   * Calculate a composite sleep score (0-100).
   * Quality contributes 60%, hours contribute 40%.
   * @param {number} quality - Sleep quality rating 1-5
   * @param {number} hours - Sleep hours
   * @returns {number} Score 0-100
   */
  function calculateSleepScore(quality, hours) {
    if (!quality && !hours) return 0;
    var qualityScore = 0;
    var hoursScore = 0;
    var hasQuality = quality > 0;
    var hasHours = hours > 0;

    if (hasQuality) {
      qualityScore = ((quality - 1) / 4) * 100;
    }

    if (hasHours) {
      if (hours >= 7 && hours <= 9) {
        hoursScore = 100;
      } else if (hours < 7 && hours >= 5) {
        hoursScore = ((hours - 5) / 2) * 100;
      } else if (hours > 9 && hours <= 11) {
        hoursScore = ((11 - hours) / 2) * 100;
      } else {
        hoursScore = 0;
      }
    }

    if (hasQuality && hasHours) {
      return Math.round(qualityScore * 0.6 + hoursScore * 0.4);
    } else if (hasQuality) {
      return Math.round(qualityScore);
    } else {
      return Math.round(hoursScore);
    }
  }

  /**
   * Get a contextual sleep tip based on score, quality, and hours.
   * @param {number} score - Sleep score 0-100
   * @param {number} quality - Sleep quality 1-5
   * @param {number} hours - Sleep hours
   * @param {string} lang - 'en' or 'nl'
   * @returns {string} Tip text
   */
  function getSleepTips(score, quality, hours, lang) {
    var l = lang || 'en';
    if (score >= 80) {
      return l === 'nl' ? 'Je slaap is top! Blijf dit ritme houden.' : 'Your sleep is great! Keep this rhythm going.';
    }
    if (hours > 0 && hours < 6) {
      return l === 'nl' ? 'Je slaapt te weinig. Probeer een vast bedtijd en sta eerder op.' : 'You\'re not sleeping enough. Try a consistent bedtime routine.';
    }
    if (hours > 9) {
      return l === 'nl' ? 'Te veel slaap kan je juist moe maken. Probeer 7-9 uur aan te houden.' : 'Oversleeping can make you groggy. Aim for 7-9 hours.';
    }
    if (quality > 0 && quality <= 2) {
      return l === 'nl' ? 'Slechte slaapkwaliteit? Probeer: geen schermen voor bed, koele kamer, vast ritme.' : 'Poor sleep quality? Try: no screens before bed, cool room, consistent schedule.';
    }
    if (score >= 50) {
      return l === 'nl' ? 'Je slaap is ok maar kan beter. Focus op een donkere, stille slaapomgeving.' : 'Your sleep is okay but could improve. Focus on a dark, quiet sleep environment.';
    }
    return l === 'nl' ? 'Je slaap heeft aandacht nodig. Begin met een vast slaapschema.' : 'Your sleep needs attention. Start with a consistent sleep schedule.';
  }

  /** Public API */
  return {
    analyzeTrends: analyzeTrends,
    generateAdvice: generateAdvice,
    detectPatterns: detectPatterns,
    generateReport: generateReport,
    processChat: processChat,
    calculateWellnessScore: calculateWellnessScore,
    getScoreColor: getScoreColor,
    getScoreLabel: getScoreLabel,
    getLevel: getLevel,
    checkAchievements: checkAchievements,
    getDailyQuote: getDailyQuote,
    getDailyAffirmation: getDailyAffirmation,
    getPetState: getPetState,
    getPetSpeech: getPetSpeech,
    getPetTapSpeech: getPetTapSpeech,
    generateDailyQuests: generateDailyQuests,
    checkQuestCompletion: checkQuestCompletion,
    getStreakMultiplier: getStreakMultiplier,
    generateWeeklyChallenge: generateWeeklyChallenge,
    checkWeeklyChallengeProgress: checkWeeklyChallengeProgress,
    getWeekStart: getWeekStart,
    calculateSleepScore: calculateSleepScore,
    getSleepTips: getSleepTips,
    XP_PER_CHECKIN: XP_PER_CHECKIN
  };
})();
