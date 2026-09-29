# AI StudyLab

A professional 10-task HTML/CSS/JavaScript classroom project by **Ravi**.

## Gemini API — secure deployment

The frontend does **not** store a Gemini API key anymore. AI requests go through the serverless endpoint in `api/gemini.js`.

### Deploy the AI backend on Vercel

1. Open Vercel and import this GitHub repository.
2. Deploy the project.
3. In the Vercel project, open **Settings → Environment Variables**.
4. Add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key from Google AI Studio
5. Redeploy the Vercel project after adding the variable.
6. Copy the Vercel deployment URL.
7. Open `js/gemini.js` in GitHub and replace:
   `https://REPLACE-WITH-YOUR-VERCEL-URL.vercel.app/api`
   with:
   `https://YOUR-VERCEL-DOMAIN.vercel.app/api`
8. Commit that frontend change.

The API key stays in Vercel's server environment and is never sent to the browser or committed to GitHub. Google documents that API keys should not be exposed in client-side production code. urlGemini API key guidancehttps://ai.google.dev/gemini-api/docs/api-key

### GitHub Pages

After the backend is deployed, enable GitHub Pages for the repository and publish the static frontend. GitHub Pages hosts the frontend; Vercel handles the Gemini server-side request.

## Google Sheets task

See `google-apps-script/Code.gs`. Deploy it as a Web App, allow the required access, then paste the `/exec` URL into Task 5. Do not place secrets in the repository.
