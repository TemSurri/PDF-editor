# Free & Simple PDF Form Filler

<img width="927" height="787" alt="Screenshot 2025-10-02 at 9 22 42 PM" src="https://github.com/user-attachments/assets/7d9a6217-b6da-4a8b-8e34-07d2624b3e7e" />

# Status
Currently on https://thefreepdfeditorsimple.onrender.com/

Current Fix Agenda: 
- UI buttons are a little hard to follow and misleading + clean cicd
- Mobile refinement : works on mobile but very hard to manage

# Use Case

  Most PDF editors are either:

   - Too basic → they only let you view or add plain text, no drawing.
   - Too expensive → locked behind subscriptions like Adobe.

  But for a lot of people, including myself and my piano teacher, the biggest need is simply filling out forms 
  like job applications, government paperwork, school/scholarship forms, leases, etc.

  That’s exactly why I made this project:
  So people who don't have establsihed methods of pdf editing
  can have access to a free, no-subscription, in-between PDF editor made just for form filling.

# Features:

  - 📝 Fill out PDF forms easily
  - 🔒 Secure — your files never leave your session
    (You need to set up a quick login to secure your filled forms, as they may contain sensitive info)
  - Works in the browser 
  - 100% free, no subscription required


# Tech Stack:
- Backend: Python, Django REST Framework
- Frontend: React, JavaScript
- Database: SQLite (just to store users, no complex data as pdf edits are only session based)
- Auth: simpleJWT stored in HttpOnlyCookies + CSRF 
- Containerization: Docker

  
