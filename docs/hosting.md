# Hosting and domain

- Domains (OVHcloud): `osheenturner.com` (main) and `osheenturner.fr` (redirects to the .com).
- Hosting: OVHcloud free web hosting (Apache, SFTP), folder `www/`. The Apache rules are in `public/.htaccess`
  (everything else redirects to `https://osheenturner.com/`, https is forced, `404.html` is the error page).
- The build defaults to `https://osheenturner.com/` with base `/` (`astro.config.mjs`). Other hosts:
  `SITE_URL=... SITE_BASE=... npm run build`.
- GitHub Pages keeps serving the old address (`sudosheen.github.io/My-portfolio-website/`) with its own build
  until the domain is live; then it becomes a redirect to the .com.
- Deploy: `.github/workflows/deploy.yml` builds twice (production and Pages) and, once the secrets exist, uploads the
  production build by SFTP (lftp; the free plan has no FTPS). Secrets: `OVH_FTP_SERVER`, `OVH_FTP_USER`, `OVH_FTP_PASSWORD`; optional variable
  `OVH_FTP_DIR` (default `www/`). Without the secrets the job is skipped.

## Go-live checklist
1. OVH: attach the .com to the hosting (the free plan allows one site), create the FTP user, enable the free SSL certificate; redirect the .fr to the .com with the OVH domain redirection.
2. Add the three secrets in GitHub; run the workflow (or push to `main`).
3. Check `https://osheenturner.com/` (EN, FR, CV, case studies, favicon, 404) and that `.fr`, `www` and `http://` redirect.
4. Follow-up PR: change the hosting wording (Site info, Legal page with the host's details, `this-website.json`),
   and turn the GitHub Pages deploy into a redirect to the .com.
