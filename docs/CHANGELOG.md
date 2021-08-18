# Changelog
- [v0.2.14](#v0214)
- [v0.2.11](#v0211)
- [v0.2.10](#v0210)
- [v0.2.9](#v029)
- [v0.2.4-8](#v024-8)
- [v0.2.3](#v023)
- [v0.2.2](#v022)
- [v0.2.1](#v021)
- [v0.2.0](#v020)

### v0.2.14
#### Changes
 - `res.cookies.expire` now accepts `CookieOptions` parameter

### v0.2.11
#### Fixes
 - Content-Length for textual responses


### v0.2.10
 - JSDocs added

#### Fixes
 - Default port fix


### v0.2.9
Performance improvement by
 - Added Keep-Alive
 - Multithreading

### v0.2.4-8
Docs revision

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