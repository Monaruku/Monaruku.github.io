/* ── Tarot Interpretation Data ── */
window.TAROT_INTERPRETATIONS = {

  /* ── Position Templates ── */
  positions: {
    past: {
      label: "Past",
      intro: "This card represents influences and events from your past that are shaping your current situation.",
      upright: [
        "In the past position, this card reveals foundations and experiences that have positively shaped who you are today.",
        "Looking back, this card illuminates the strengths and lessons from your history that continue to support you.",
        "Your past holds the key to understanding the present — this card highlights the formative energies that brought you here."
      ],
      reversed: [
        "In the past position reversed, this card suggests unresolved energy or patterns from your history that still influence you.",
        "Looking back, this reversed card reveals lessons from your past that were not fully integrated or healed.",
        "Your past holds unfinished business — this card highlights what from your history still needs attention."
      ]
    },
    present: {
      label: "Present",
      intro: "This card represents your current state, the energies surrounding you right now, and the challenges or gifts of this moment.",
      upright: [
        "In the present position, this card reveals the dominant energies actively shaping your life right now.",
        "This card captures the essence of your current moment — the forces at play and the opportunities before you.",
        "Right now, this card reflects the living truth of your situation and the power available to you in this moment."
      ],
      reversed: [
        "In the present position reversed, this card reveals internal blocks or hidden challenges affecting your current situation.",
        "This reversed card captures the shadow side of your current moment — what you may be avoiding or struggling with.",
        "Right now, this card reflects the tension between what is happening externally and what you feel internally."
      ]
    },
    future: {
      label: "Future",
      intro: "This card represents what is coming, the potential outcomes ahead, and the trajectory your current path is leading toward.",
      upright: [
        "In the future position, this card signals the positive trajectory and emerging energies heading your way.",
        "Looking ahead, this card reveals the potential and promise that your current path is building toward.",
        "The future holds this energy for you — a natural unfolding of the seeds you are planting now."
      ],
      reversed: [
        "In the future position reversed, this card signals potential challenges or internal work needed on the path ahead.",
        "Looking ahead, this reversed card reveals areas where growth or change is needed before your goals can be reached.",
        "The future asks you to address this energy — a warning and invitation to course-correct now."
      ]
    }
  },

  /* ── Category Modifiers ── */
  categories: {
    love: {
      label: "Love & Relationships",
      icon: "\u2665",
      tone: "Through the lens of love and relationships,",
      intros: [
        "Your question about love and connection is reflected beautifully in this spread.",
        "The cards speak directly to matters of the heart and the bonds that shape your emotional world.",
        "Love is the thread weaving through this reading — let each card illuminate your path to deeper connection."
      ],
      summaries: [
        "This reading reveals a journey of the heart. Trust that love, in all its forms, is guiding you toward wholeness.",
        "The cards speak of connection, vulnerability, and the courage to love authentically. Let your heart lead.",
        "Your path in love is one of growth and deepening. Each card adds a layer of understanding to your emotional journey."
      ]
    },
    career: {
      label: "Career & Ambition",
      icon: "\u2605",
      tone: "Through the lens of career and professional growth,",
      intros: [
        "Your question about career and ambition is reflected in the wisdom of these cards.",
        "The cards speak to your professional journey, your ambitions, and the path of growth before you.",
        "Career and purpose are woven through this reading — let each card guide your professional vision."
      ],
      summaries: [
        "This reading charts your professional evolution. Trust that your dedication and vision are building something meaningful.",
        "The cards speak of ambition, strategy, and the patience to build lasting success. Keep moving forward.",
        "Your career path is one of steady growth and learning. Each card adds clarity to your professional direction."
      ]
    },
    health: {
      label: "Health & Wellness",
      icon: "\u2726",
      tone: "Through the lens of health and holistic wellness,",
      intros: [
        "Your question about health and wellbeing is reflected in these guiding cards.",
        "The cards speak to your body's wisdom, your healing journey, and the path to holistic wellness.",
        "Health and vitality are the threads of this reading — let each card illuminate your wellness path."
      ],
      summaries: [
        "This reading reveals a journey of healing and wholeness. Trust your body's wisdom and honor its needs.",
        "The cards speak of balance, self-care, and the patience to nurture lasting wellness. Listen to your body.",
        "Your health journey is one of awareness and growth. Each card deepens your understanding of holistic wellbeing."
      ]
    },
    spiritual: {
      label: "Spiritual Growth",
      icon: "\u2727",
      tone: "Through the lens of spiritual growth and inner wisdom,",
      intros: [
        "Your question about spiritual growth is beautifully reflected in these sacred cards.",
        "The cards speak to your soul's journey, your inner evolution, and the deeper wisdom available to you.",
        "Spiritual truth is woven through this reading — let each card open a door to deeper understanding."
      ],
      summaries: [
        "This reading maps your spiritual evolution. Trust the inner wisdom that guides you and honor your sacred journey.",
        "The cards speak of awakening, surrender, and the courage to follow your soul's calling. Trust the path.",
        "Your spiritual journey is one of deepening and unfolding. Each card adds light to your sacred way."
      ]
    },
    general: {
      label: "General Guidance",
      icon: "\u25ce",
      tone: "Through the lens of general life guidance,",
      intros: [
        "The cards offer broad wisdom for your current life journey and the energies surrounding you.",
        "This reading speaks to the full tapestry of your life — every thread is connected and meaningful.",
        "General guidance emerges from this spread — let the cards speak to whatever resonates most deeply."
      ],
      summaries: [
        "This reading offers a panoramic view of your journey. Trust the wisdom of the cards and the path that unfolds.",
        "The cards speak of growth, change, and the courage to move forward with wisdom. You are exactly where you need to be.",
        "Your journey is one of continuous learning and becoming. Each card adds depth to the larger story of your life."
      ]
    }
  },

  /* ── Card Pair Interactions ── */
  pairInteractions: {
    "The Fool-The Magician": "New beginnings meet manifestation — your fresh start is powered by focused will and creative skill.",
    "The Fool-The Tower": "The innocent meets upheaval — your leap of faith may lead through unexpected disruption, but growth awaits.",
    "The Magician-The High Priestess": "Conscious power meets unconscious wisdom — you have access to both visible and hidden resources.",
    "The Empress-The Emperor": "Nurturing creativity meets structured authority — together they build lasting, abundant foundations.",
    "The Lovers-The Devil": "Love meets shadow — examine whether attachment disguised as love is binding you to unhealthy patterns.",
    "The Lovers-The Tower": "Love meets upheaval — a relationship may face dramatic change, but what survives the storm is genuine.",
    "The Chariot-Strength": "Determination meets inner courage — external willpower and internal patience create unstoppable force.",
    "The Hermit-The Star": "Solitude meets hope — your time alone is leading you toward a renewed sense of purpose and inspiration.",
    "The Hermit-The Moon": "Solitude meets illusion — be careful that introspection does not become confusion or fear-driven isolation.",
    "Wheel of Fortune-Justice": "Destiny meets accountability — the turning of fate is guided by the universal law of cause and effect.",
    "Wheel of Fortune-The Tower": "Fate meets upheaval — a dramatic cycle change is underway, clearing the way for a new chapter.",
    "Death-The Star": "Transformation meets renewal — the ending you face leads directly to hope and healing.",
    "Death-The Tower": "Transformation meets upheaval — powerful change is underway from multiple directions; surrender to the process.",
    "Death-The Sun": "Transformation meets joy — the ending releases you into a period of radiant happiness and vitality.",
    "The Devil-The Tower": "Bondage meets upheaval — the chains you thought were permanent are about to break in dramatic fashion.",
    "The Devil-The Star": "Shadow meets hope — even in the depths of attachment, the light of liberation is visible.",
    "The Tower-The Star": "Upheaval meets renewal — from the rubble of what was destroyed, hope and healing emerge beautifully.",
    "The Tower-Death": "Upheaval meets transformation — dramatic external change accelerates deep internal metamorphosis.",
    "The Moon-The Sun": "Illusion meets clarity — the confusion of the night gives way to the brilliant light of understanding.",
    "The Moon-The High Priestess": "Illusion meets intuition — your unconscious mind holds both fear and wisdom; trust the deeper knowing.",
    "The Sun-The World": "Joy meets completion — success and fulfillment converge in a moment of radiant achievement.",
    "Judgement-The World": "Rebirth meets completion — answering your higher calling leads to the fulfillment of your soul's journey.",
    "Strength-The Devil": "Inner courage faces shadow — your gentle strength is exactly what is needed to release what binds you.",
    "Temperance-The Devil": "Balance confronts addiction — moderation is the antidote to excess; restore equilibrium to break free.",
    "The Hanged Man-Death": "Surrender meets transformation — releasing your perspective willingly accelerates the profound change coming.",
    "The Hanged Man-The Tower": "Pause meets upheaval — what you resist releasing voluntarily may be taken by dramatic force.",
    "Ace of Cups-Two of Cups": "New emotional energy meets partnership — love is beginning with deep mutual connection and promise.",
    "Three of Swords-Five of Cups": "Heartbreak meets grief — profound sorrow is present, but healing and acceptance are on the horizon.",
    "Ten of Cups-The Sun": "Complete happiness meets joy — radiant fulfillment in love, family, and life is your current reality.",
    "Ten of Swords-Death": "Rock bottom meets transformation — the definitive ending clears the way for complete metamorphosis.",
    "Ace of Wands-Ace of Swords": "Creative spark meets mental clarity — inspired ideas backed by clear thinking create powerful beginnings.",
    "Ace of Pentacles-The World": "New material opportunity meets completion — a new venture begins at the peak of your current cycle.",
    "King of Cups-Queen of Cups": "Emotional mastery meets compassionate wisdom — deep emotional intelligence creates powerful partnership.",
    "Knight of Swords-Knight of Wands": "Intellectual ambition meets passionate action — powerful drive in both mind and fire creates unstoppable momentum.",
    "Eight of Swords-Nine of Swords": "Restriction meets anxiety — self-imposed limitations fuel the worry that keeps you trapped; break the cycle.",
    "Five of Pentacles-Six of Pentacles": "Hardship meets generosity — help is available if you have the courage to accept it."
  },

  /* ── Generic Pair Bridging (fallback for unlisted pairs) ── */
  genericBridges: [
    "These two cards interact to create a dynamic tension between {card1} and {card2} — the past informs the present in meaningful ways.",
    "The energy of {card1} flows into {card2}, creating a natural progression from one state of being to the next.",
    "Together, {card1} and {card2} suggest a theme of growth and transformation across different areas of your life.",
    "The conversation between {card1} and {card2} reveals a deeper pattern — what seems separate is actually connected.",
    "{card1} sets the stage for {card2}, showing how earlier influences are shaping the energies ahead.",
    "The bridge between {card1} and {card2} speaks of evolution — you are moving from one chapter into the next with growing wisdom."
  ],

  /* ── Overall Summary Templates ── */
  summaryTemplates: {
    majorDominant: [
      "With {count} Major Arcana in your spread, this reading speaks of significant life themes and soul-level lessons. The universe is highlighting your deeper journey.",
      "The prominence of Major Arcana cards signals that you are at a pivotal point in your life's larger story. Pay attention to these archetypal messages."
    ],
    minorDominant: [
      "With mostly Minor Arcana cards, this reading speaks to the practical, day-to-day aspects of your journey. Focus on the specific areas highlighted by each suit.",
      "The Minor Arcana dominance suggests that your current questions are best answered through practical action and attention to daily life details."
    ],
    balanced: [
      "A balanced mix of Major and Minor Arcana suggests both significant life themes and practical daily considerations are at play.",
      "The balance between Major and Minor Arcana reflects the harmony between your soul's larger journey and your everyday experience."
    ],
    suitDominant: {
      wands: "The dominance of Wands in your spread highlights themes of passion, creativity, and inspired action. Fire energy is your current ally.",
      cups: "The dominance of Cups in your spread emphasizes emotions, relationships, and matters of the heart. Water energy guides your path.",
      swords: "The dominance of Swords in your spread points to mental clarity, communication, and intellectual challenges. Air energy sharpens your focus.",
      pentacles: "The dominance of Pentacles in your spread grounds you in material reality, health, and practical abundance. Earth energy stabilizes your path."
    },
    closings: [
      "Remember, tarot illuminates possibilities rather than dictating fate. You hold the power to shape your path with the wisdom these cards have revealed.",
      "The cards offer guidance, not destiny. Take what resonates, reflect on what challenges you, and trust your inner wisdom to navigate what lies ahead.",
      "This reading is a snapshot of current energies — as you grow and change, so too will the possibilities before you. Return to these insights as you evolve.",
      "Carry the wisdom of this reading with you, knowing that every moment offers the chance to realign with your highest path."
    ]
  }
};
