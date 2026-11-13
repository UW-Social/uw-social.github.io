# UW-Social Event Evaluation System — Summary

This system evaluates an event’s **expected value for its intended audience**, using consistent criteria and verifiable information. Scores estimate potential value before attendance; they do not guarantee the actual experience.

## 1. Classify the Event First

| Category | Primary purpose | Examples |
|---|---|---|
| **Learning & Growth** | Develop knowledge, skills, direction, or professional and academic connections | Research talks, business workshops, career events |
| **Social & Recreation** | Build friendships, enjoy shared experiences, or recharge | Picnics, movie nights, board games, hikes |
| **Hybrid** | Provide substantial, distinct experiences in both categories | A workshop followed by an equally substantial social program |

Classification should follow the event’s **purpose and agenda**, not its organizer or subject. A CS club’s game night is a Social event.

For Hybrid events, calculate both scores separately. If information is insufficient to classify an event, mark it as **Needs clarification**.

## 2. Learning & Growth Matrix

| Dimension | Weight | Evaluation criteria |
|---|---:|---|
| **Opportunities & Direction** | **40%** | Helps attendees explore meaningful career, education, research, or project decisions; identifies concrete opportunities or pathways; provides actionable next steps or support. |
| **Meaningful Connections** | **33%** | Provides access to relevant people; enables meaningful two-way interaction; offers opportunities to maintain connections afterward. |
| **Knowledge & Insight** | **27%** | Offers specific, credible content; supports deeper understanding and critical thinking; provides transferable knowledge, methods, or perspectives. |

Each dimension contains three equally weighted criteria, corresponding to the three statements above.

## 3. Social & Recreation Matrix

| Dimension | Weight | Evaluation criteria |
|---|---:|---|
| **Social Connection** | **64%** | Creates opportunities to build or strengthen relationships; helps participants feel included and join comfortably; supports continued connections or future gatherings. |
| **Relaxation & Well-being** | **36%** | Provides a clear recreational experience; respects participants’ comfort and freedom to choose their involvement; includes practical arrangements that support the experience. |

Each dimension contains three equally weighted criteria.

These initial weights reflect the priorities expressed in the seven survey responses. They are provisional: selection frequency is not an exact measurement of importance.

## 4. Score Each Criterion Using Evidence

| Rating | Meaning |
|---|---|
| **0** | Evidence confirms the relevant benefit or mechanism is absent. |
| **1** | A limited mechanism exists but falls below the basic standard. |
| **2** | Meets a clear, concrete basic standard. |
| **3** | Meets the basic standard and some advanced conditions. |
| **4** | Fully meets the criterion’s strongest defined standard. |

For example, when evaluating meaningful interaction:

- **0:** Explicitly one-way viewing with no interaction.
- **2:** A scheduled Q&A or discussion.
- **4:** Structured interaction with sufficient time, facilitation, or group arrangements to support deeper exchanges.
- **Limited evidence:** Promotional claims alone do not establish a mechanism. Any estimate must be explained and reflected in lower confidence.

Every rating must include a brief explanation and supporting evidence. This summary describes the framework; consistent operational scoring also requires the criterion-specific anchors in the full matrix.

## 5. Calculate and Display Scores

**Dimension Score = (Average Criterion Rating / 4) × 100**

**Raw Overall Score = Sum of (Dimension Score × Fixed Dimension Weight)**

**Curved Total = round(60 + Raw Overall Score × 0.40)**

**Displayed Score = Curved Total / 20**, rounded to one decimal place on a five-point scale.

Keep the weights above fixed: Growth 40% / 33% / 27%; Social 64% / 36%. Each dimension's three criteria remain equally weighted. Calculate at full precision and round only the displayed total. The curve maps raw 0 / 50 / 100 to displayed 60 / 80 / 100, preserving ordering. The card displays totals on a 3.0–5.0 scale; dimension scores use the same mapping, (60 + raw dimension score × 0.40) / 20, on a 3.0–5.0 scale. This linear mapping preserves the fixed-weight relationship between dimensions and total before rounding. Stored scoring values and fixed weights remain unchanged.

Rate all applicable criteria individually from the event’s purpose, agenda and format. Explain any inference as an estimate and lower confidence for missing, vague or contradictory information. Never fill missing ratings with a default 2/4, substitute a midpoint, or redistribute weights. If the supplied facts cannot support a meaningful assessment, request clarification instead of inventing ratings.

Confidence (low / medium / high) describes evidence quality and is separate from the weighted score. Returning a numeric estimate does not mean complete evidence. Saved score ranges and incomplete neutral-filled totals require reassessment from event content; do not convert them into a single score.

For example, Social Connection rated 3 on all three criteria and Relaxation & Well-being rated 1 on all three gives raw (75 × 0.64) + (25 × 0.36) = 57, then curved **83/100**, displayed as **4.2/5**. Swapping the dimension ratings changes the result because the weights remain fixed.

## 6. Keep Comparisons Fair

- Apply identical criteria and weights across subjects. CS and Business events can receive the same score when they provide comparable value to their respective audiences.
- Do not award points simply for prestige, celebrity speakers, popularity, technical difficulty, price, or size.
- Consider participant diversity only when it meaningfully supports relevant perspectives, interaction, or inclusion.
- Compare overall scores **within the same category**. Growth and Social scores measure different benefits.
- Display dimension scores alongside the total: an excellent research talk may offer substantial knowledge but limited networking.
- Keep personal relevance, cost, travel, scheduling, and eligibility separate from the core value score.

The result should help users understand both **how much value an event may offer** and **whether that value matches what they are looking for**.
