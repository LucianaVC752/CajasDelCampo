const request = require('supertest');
const app = require('../../../server');

describe('CSP report endpoint', () => {
  it('accepts application/csp-report and returns 204', async () => {
    const res = await request(app)
      .post('/api/security/csp-report')
      .set('Content-Type', 'application/csp-report')
      // Para application/csp-report, enviar cuerpo como string/raw
      .send(
        JSON.stringify({
          'csp-report': {
            'document-uri': 'http://localhost:5000/',
            'violated-directive': 'script-src',
            'effective-directive': 'script-src-elem',
            'blocked-uri': 'inline'
          }
        })
      );
    expect(res.status).toBe(204);
  });

  it('accepts application/json and returns 204', async () => {
    const res = await request(app)
      .post('/api/security/csp-report')
      .set('Content-Type', 'application/json')
      .send({
        'csp-report': {
          'document-uri': 'http://localhost:5000/',
          'violated-directive': 'img-src',
          'effective-directive': 'img-src',
          'blocked-uri': 'data'
        }
      });
    expect(res.status).toBe(204);
  });
});