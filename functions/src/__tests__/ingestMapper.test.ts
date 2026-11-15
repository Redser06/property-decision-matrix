import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHtmlSignals, isAntiBotChallenge } from '../ingestMapper.ts';

test('extractHtmlSignals pulls og:image, JSON-LD, and body text cleanly', () => {
  const sampleHtml = `
    <html>
      <head>
        <title>14 Killiney Hill Road, Killiney, Co. Dublin - 5 Bed Detached | Daft.ie</title>
        <meta name="description" content="Substantial 5 bedroom detached family home asking €1,650,000." />
        <meta property="og:image" content="https://media.daft.ie/eyJidWNrZXQiOiJtZWRpYS1kYWZ0Iiwia2V5IjoiaG91c2UuanBnIn0=" />
        <script type="application/ld+json">
          {"@type":"SingleFamilyResidence","numberOfBedrooms":5,"numberOfBathroomsTotal":4}
        </script>
      </head>
      <body>
        <main><h1>14 Killiney Hill Road</h1><p>5 Bedrooms, 4 Bathrooms, 260 sq m, BER B2</p></main>
      </body>
    </html>
  `;
  const signals = extractHtmlSignals(sampleHtml, 'https://www.daft.ie/for-sale/example/123');
  assert.match(signals.title, /5 Bed Detached/);
  assert.equal(
    signals.ogImage,
    'https://media.daft.ie/eyJidWNrZXQiOiJtZWRpYS1kYWZ0Iiwia2V5IjoiaG91c2UuanBnIn0='
  );
  assert.equal(signals.jsonLdSnippets.length, 1);
  assert.match(signals.bodyTextSnippet, /260 sq m/);
});

test('isAntiBotChallenge detects Cloudflare and HTTP 403 blocks cleanly', () => {
  assert.equal(isAntiBotChallenge(403, '<html>Forbidden</html>'), true);
  assert.equal(
    isAntiBotChallenge(200, '<html><title>Just a moment...</title><div>cf-browser-verification</div></html>'),
    true
  );
  assert.equal(isAntiBotChallenge(200, '<html><title>5 Bed House</title></html>'), false);
});
