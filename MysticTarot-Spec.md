# Mystic Tarot — Android App Specification

## Overview
An interactive Tarot reading Android app where users shuffle and draw cards manually, then receive AI-generated readings powered by the Gemini API based on their question and drawn cards.

---

## Core User Flow

1. **Ask a Question** — User types a question (or selects a category: Love, Career, Health, Spiritual, General)
2. **Shuffle the Deck** — Interactive shuffling animation (swipe/drag to shuffle)
3. **Draw Cards** — User taps/swipes to draw cards from the deck (configurable: 1-card, 3-card Past/Present/Future, or custom spread)
4. **Reveal Cards** — Tap to flip each card with animation; orientation (upright/reversed) is determined at draw time
5. **Receive Reading** — Gemini API generates a personalized reading based on: the question, drawn cards, their positions, and orientations
6. **Save / Review** — Reading is saved locally for future reference

---

## Features

### Must-Have (MVP)
- Question input with optional category selection
- Interactive deck shuffling (animated)
- Card drawing with flip reveal animation
- 78-card Rider-Waite tarot deck (Major + Minor Arcana)
- Upright and reversed card orientations
- 3-card spread (Past / Present / Future)
- Gemini API integration for reading generation
- Reading display with card imagery + interpretation text
- Local reading history (save & browse past readings)

### Nice-to-Have (v2)
- Single card daily draw
- Celtic Cross and custom spreads
- Card of the day / daily notification
- Favorites / bookmarked readings
- Dark/light theme toggle
- Share reading as image/text
- Multiple deck art styles

---

## Tech Stack

| Component | Technology |
|---|---|
| Language | Kotlin |
| UI Framework | Jetpack Compose + Material 3 |
| Animations | Compose Animation APIs (AnimatedVisibility, Animatable, gesture detection) |
| AI Backend | Google Gemini Android SDK (`gemini-android-sdk`) |
| Architecture | MVVM + Repository |
| Local Storage | Room Database (reading history) + DataStore (settings) |
| Dependency Injection | Hilt |
| Image Loading | Coil (for card artwork) |
| Networking | Retrofit/OkHttp (if needed beyond SDK) |
| Navigation | Compose Navigation |

---

## Architecture

```
┌─────────────────────────────────────┐
│              UI Layer               │
│  (Compose Screens + ViewModels)     │
│                                     │
│  HomeScreen → ShuffleScreen →       │
│  DrawScreen → ReadingScreen →       │
│  HistoryScreen                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│           Domain Layer              │
│  UseCases: ShuffleDeck, DrawCards,  │
│  GenerateReading, GetHistory        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│            Data Layer               │
│  GeminiRepository (API calls)       │
│  ReadingRepository (Room DB)        │
│  DeckRepository (card data)         │
└─────────────────────────────────────┘
```

---

## Data Models

### Card
- `id: Int` (0–77)
- `name: String` (e.g. "The Fool")
- `arcana: Arcana` (Major / Minor)
- `suit: Suit?` (Wands, Cups, Swords, Pentacles — null for Major)
- `imageRes: Int` (drawable resource)
- `keywords: List<String>` (for prompt context)

### DrawnCard
- `card: Card`
- `orientation: Orientation` (Upright / Reversed)
- `position: Position` (Past / Present / Future)

### Reading
- `id: UUID`
- `question: String`
- `category: Category`
- `drawnCards: List<DrawnCard>`
- `interpretation: String` (Gemini response)
- `timestamp: Long`

---

## Gemini API Integration

### Prompt Engineering Strategy
Build a structured prompt sent to Gemini containing:
- System instruction: "You are an experienced tarot reader. Provide insightful, warm, and balanced readings."
- User's question
- Drawn cards with name, orientation, and position
- Request structured output: overall reading + per-card interpretation + advice

### Example Prompt
```
You are a skilled tarot reader. A user has asked: "{question}"
Category: {category}

Cards drawn:
- Past: {card1.name} ({orientation1})
- Present: {card2.name} ({orientation2})  
- Future: {card3.name} ({orientation3})

Provide a thoughtful reading covering:
1. Overall energy and theme
2. Individual card interpretation in their position
3. How the cards relate to each other
4. Guidance and advice
```

### Error Handling
- API timeout → show retry with graceful message
- Rate limiting → queue + inform user
- No internet → allow offline card draw, queue reading generation for later

---

## Screen Breakdown

| Screen | Description |
|---|---|
| **HomeScreen** | App landing — "New Reading" button + "Reading History" |
| **QuestionScreen** | Text input for question + category chips |
| **ShuffleScreen** | Full deck displayed, swipe gestures to shuffle, animated card movement |
| **DrawScreen** | Fan-spread deck, tap cards to draw, slot into position |
| **RevealScreen** | Drawn cards face-down, tap to flip with 3D rotation animation |
| **ReadingScreen** | Displays cards + Gemini-generated interpretation, loading state while generating |
| **HistoryScreen** | List of past readings, tap to view full detail |

---

## Card Artwork
- Use public domain Rider-Waite illustrations (copyright expired)
- Store as drawable resources or in assets folder
- Consider vector (SVG → VectorDrawable) for crisp scaling
- Reversed cards: rotate image 180° in Compose (no duplicate assets needed)

---

## Non-Functional Requirements
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 35
- **APK Size**: < 30MB (with card artwork)
- **Offline**: Card shuffling/drawing works offline; reading generation requires internet
- **API Key**: Stored securely via encrypted DataStore or local.properties (not in source control)
- **Privacy**: Reading history stored locally only, no cloud sync unless explicitly added later
