# Changelog
### v0.2.3
Migration from GitLab to GitHub

### v0.2.2
Minor fixes

### v0.2.1
- README.md reviewed
- Added DOCS.md
- Added CHANGELOG.md

### v0.2.0
#### New features
- Added this changelog
- Added basic cookie management
- ".map()" added to `Request`
- Any request payload size is now limited to Request.MAX_PAYLOAD_SIZE (8MB) by default

#### Fixes
- Parameter name parsing inside multipart payload
- Multipart parsing failure for small files
- Multipart payload values got trailing CRLF