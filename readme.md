# Mini Job Board

A frontend application that simulates a real-world job board with dynamic data handling, filtering logic, UI state management, and theme persistence.

This project focuses on building practical frontend skills using vanilla JavaScript without frameworks.

---

## Live Demo

[View Live Demo](https://alejosworkstuff.github.io/mini-job-board/)

## Project Goals

- Work with dynamic JSON data
- Implement real-time search and filtering logic
- Manage UI state without frameworks
- Persist user preferences using localStorage
- Build a clean and responsive interface

## Features

- Dynamic job rendering from external JSON file
- Real-time search by title and company
- Multi-filter system (type + seniority)
- Graceful empty state handling
- Dark mode with persistence
- Responsive layout
- Visual seniority badges for quick scanning

## Technical Concepts Applied

- DOM manipulation
- Array filtering & chaining
- Event handling
- Conditional rendering
- LocalStorage API
- Separation of concerns (data / logic / UI)
- Clean folder structure

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)

## Project Structure

```text
mini-job-board/
│
├── data/
│   └── jobs.json
├── assets/
│   └── screenshots/
├── index.html
├── styles.css
└── app.js
```

## How to Run Locally

1. Clone the repository:

```bash
git clone https://github.com/alejosworkstuff/mini-job-board.git
cd mini-job-board
```

Then:
 Open `index.html` using Live Server or your browser.

## Data Model

Each job object includes:

- `id`
- `title`
- `company`
- `type` (Remote | Hybrid | Onsite)
- `location`
- `seniority` (Junior | Semi-Senior | Senior | Trainee)

## Screenshots

(Add screenshots here if available)

## Future Improvements

- Pagination
- Sorting by date
- Backend integration (API)
- Authentication simulation
- Save jobs feature

## License

MIT License
