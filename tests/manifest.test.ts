import { describe, expect, it } from 'vitest';
import { GECKO_ID, TARGETS, buildManifest } from '../scripts/manifest.mjs';
import hosts from '../src/manifest/hosts.json';
import { BALE_MATCHES, TOGGLE_COMMAND } from '../src/common/constants.js';

describe('buildManifest', () => {
  it.each(TARGETS)('produces a valid MV3 manifest for %s', (target) => {
    const manifest = buildManifest(target, '1.2.3');
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.version).toBe('1.2.3');
    expect(manifest.default_locale).toBe('en');
    expect(manifest.content_scripts[0].matches).toEqual(hosts.matches);
    expect(manifest.commands).toHaveProperty(TOGGLE_COMMAND);
  });

  it('asks for storage and nothing else', () => {
    for (const target of TARGETS) {
      const manifest = buildManifest(target);
      expect(manifest.permissions).toEqual(['storage']);
      expect(manifest).not.toHaveProperty('host_permissions');
    }
  });

  it('uses a service worker on Chrome and a script list on Firefox', () => {
    expect(buildManifest('chrome').background).toEqual({ service_worker: 'background.js' });
    expect(buildManifest('firefox').background).toEqual({ scripts: ['background.js'] });
  });

  it('pins the Firefox add-on id and the :has() baseline', () => {
    const gecko = buildManifest('firefox').browser_specific_settings.gecko;
    expect(gecko.id).toBe(GECKO_ID);
    expect(gecko.strict_min_version).toBe('121.0');
    expect(buildManifest('chrome').minimum_chrome_version).toBe('111');
  });

  it('rejects an unknown target', () => {
    expect(() => buildManifest('safari')).toThrow(/Unknown target/);
  });
});

describe('host list', () => {
  it('is shared between the manifest generator and the runtime constants', () => {
    expect([...BALE_MATCHES]).toEqual(hosts.matches);
  });
});
