# Google Authentication Setup

To enable "Sign in with Google", you need to:

1.  **Get a Google Client ID**:
    *   Go to [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   Go to **APIs & Services > Credentials**.
    *   Create Credentials > OAuth client ID.
    *   Application type: **Web application**.
    *   Authorized JavaScript origins: `http://localhost:3001` (or your port).
    *   Authorized redirect URIs: `http://localhost:3001` (optional for this flow).
    *   Copy the **Client ID**.

2.  **Update `.env`**:
    Add the simplified client ID to your `.env` file:
    ```
    GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
    ```

3.  **Database Migration**:
    If you already have a database, run the migration script to add the `google_id` column:
    ```bash
    node database/migrate_google_id.js
    ```
    (This has likely been attempted automatically but running it again is safe).

4.  **Restart Server**:
    ```bash
    npm run dev
    ```

Now the "Sign in with Google" buttons on Login and Register pages will work!
