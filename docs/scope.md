# Honeypot Service - Graduate Project Scope Document

## Document Information
- **Date Created**: November 9, 2025
- **Project**: Fake Login Honeypot for Graduate Project
- **Author**: [Your Name]
- **Institution**: [Your University]

## Deployment Decisions

### Deployment Mode
**Selected Mode**: Microservice Architecture (`/honeypot-service/`)

**Rationale**: 
- Isolated from main NestJS authentication system
- Independent scaling and maintenance
- Better security through separation of concerns
- Easier to monitor and analyze honeypot-specific traffic
- No risk of interfering with production authentication

### URL Structure
**Selected URL**: Subdomain approach - `admin.fullcraft.com`

**Alternative Considered**: Path-based `/admin-login` (not selected)

**Rationale for Subdomain**:
- Enhanced isolation from main application
- Separate SSL certificate possible
- Clearer separation in DNS and routing
- Attackers more likely to target "admin" subdomain
- No potential conflicts with existing routes
- Better for security monitoring and filtering

## Data Retention & Privacy Policy

### Data Collection
The honeypot service collects the following information:
- Source IP address (via X-Forwarded-For header with fallback)
- User Agent string
- **Hashed** username (SHA-256)
- **Hashed** password (SHA-256)
- Sample of HTTP headers
- Timestamp of attempt

### Privacy Considerations
- **No plaintext credentials** are stored
- All usernames and passwords are immediately hashed using SHA-256
- IP addresses are collected for security research purposes only
- Data is stored locally in encrypted file system

### Retention Policy
- **Retention Period**: 180 days (6 months)
- **Storage Location**: `/data/honeypot_events.jsonl` (restricted permissions: 700)
- **Access Control**: Only authorized research team members
- **Deletion Policy**: Automated purge of records older than 180 days
- **Backup Policy**: No backups to cloud; local encrypted backups only

### Data Usage
- Data will be used exclusively for graduate research project
- Analysis of attack patterns and trends
- No personal data will be shared with third parties
- Aggregated, anonymized statistics may be published in research paper

## Authorization & Approvals

### Required Approvals
- [ ] University Ethics Committee / IRB (Institutional Review Board)
- [ ] Graduate Advisor: [Advisor Name]
- [ ] IT Security Department (if university network)
- [ ] Data Protection Officer (if applicable in your region)

### Scope of Research
**Approved Purpose**: Analysis of unauthorized login attempts targeting administrative interfaces for cybersecurity research and education.

**Restrictions**:
- No active engagement with attackers
- No collection of additional personal data beyond listed items
- No offensive security actions
- Passive monitoring only

### Legal Compliance
- Compliant with local data protection regulations
- Proper disclosure in Terms of Service (if applicable)
- Educational use under university research guidelines
- No entrapment - purely defensive monitoring

## Technical Specifications

### Architecture
- **Service**: Standalone Express.js honeypot microservice
- **Container**: Docker-based deployment
- **Port**: 8080 (internal), mapped as needed
- **Data Format**: JSONL (JSON Lines)

### Security Measures
- Service runs with minimal privileges
- Data directory restricted to service user only
- No external database connections
- Regular security updates via Docker base image
- Rate limiting to prevent DoS (to be implemented in Phase 2)

## Deliverables Timeline

### Phase 0 (Completed)
- ✅ This scope document
- ✅ Deployment decisions finalized
- ✅ Authorization requirements documented

### Phase 1 (In Progress)
- Honeypot microservice scaffolding
- Basic fake login page
- Event logging to JSONL
- Docker containerization

### Future Phases
- Analytics dashboard
- Email alerts for suspicious activity
- Geographic IP analysis
- Machine learning threat detection

## Contact Information
- **Project Owner**: [Your Name]
- **Email**: [Your Email]
- **Advisor**: [Advisor Name & Email]
- **Review Date**: [Set periodic review date]

---

**Document Version**: 1.0  
**Last Updated**: November 9, 2025
