import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { ConventionalCommitMessage } from './conventional-commit-message';

describe('ConventionalCommitMessage', () => {
  let component: ConventionalCommitMessage;
  let fixture: ComponentFixture<ConventionalCommitMessage>;

  beforeAll(() => {
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn() },
        writable: true,
      });
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConventionalCommitMessage],
      providers: [
        provideZonelessChangeDetection(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConventionalCommitMessage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default type (feat)', () => {
    expect(component.type()).toBe('feat');
  });

  it('should initialize with empty scope', () => {
    expect(component.scope()).toBe('');
  });

  it('should initialize with empty description', () => {
    expect(component.description()).toBe('');
  });

  it('should initialize with isBreakingChange as false', () => {
    expect(component.isBreakingChange()).toBe(false);
  });

  it('should initialize with breakingChangeIndicator as bang', () => {
    expect(component.breakingChangeIndicator()).toBe('bang');
  });

  describe('generateCommitMessage', () => {
    it('should generate a basic commit message header', () => {
      component.type.set('feat');
      component.description.set('add new feature');
      component.generateCommitMessage();
      expect(component.commitMessagePreview()).toBe('feat: add new feature');
    });

    it('should include scope when provided', () => {
      component.type.set('fix');
      component.scope.set('auth');
      component.description.set('fix login bug');
      component.generateCommitMessage();
      expect(component.commitMessagePreview()).toBe('fix(auth): fix login bug');
    });

    it('should include bang for breaking change', () => {
      component.type.set('feat');
      component.description.set('change API');
      component.isBreakingChange.set(true);
      component.breakingChangeIndicator.set('bang');
      component.generateCommitMessage();
      expect(component.commitMessagePreview()).toContain('feat!: change API');
    });

    it('should include body when provided', () => {
      component.type.set('docs');
      component.description.set('update readme');
      component.body.set('Added new installation instructions.');
      component.generateCommitMessage();
      const preview = component.commitMessagePreview();
      expect(preview).toContain('docs: update readme');
      expect(preview).toContain('Added new installation instructions.');
    });

    it('should include BREAKING CHANGE footer', () => {
      component.type.set('feat');
      component.description.set('redesign API');
      component.isBreakingChange.set(true);
      component.breakingChangeIndicator.set('footer');
      component.breakingChangeDescription.set('API endpoints have changed');
      component.generateCommitMessage();
      const preview = component.commitMessagePreview();
      expect(preview).toContain('BREAKING CHANGE: API endpoints have changed');
    });

    it('should include additional footers', () => {
      component.type.set('feat');
      component.description.set('add feature');
      component.footers.set([{ id: 1, token: 'Refs', value: '#123' }]);
      component.generateCommitMessage();
      expect(component.commitMessagePreview()).toContain('Refs: #123');
    });
  });

  describe('addFooter', () => {
    it('should add a new footer', () => {
      const initialCount = component.footers().length;
      component.addFooter();
      expect(component.footers().length).toBe(initialCount + 1);
    });

    it('should give each footer a unique ID', () => {
      component.addFooter();
      component.addFooter();
      const footers = component.footers();
      expect(footers[0].id).not.toBe(footers[1].id);
    });

    it('should initialize new footer with empty token and value', () => {
      component.addFooter();
      const newFooter = component.footers()[component.footers().length - 1];
      expect(newFooter.token).toBe('');
      expect(newFooter.value).toBe('');
    });
  });

  describe('removeFooter', () => {
    it('should remove a footer by ID', () => {
      component.addFooter();
      const footerId = component.footers()[0].id;
      component.removeFooter(footerId);
      expect(component.footers().length).toBe(0);
    });

    it('should not remove other footers', () => {
      component.addFooter();
      component.addFooter();
      const firstId = component.footers()[0].id;
      component.removeFooter(firstId);
      expect(component.footers().length).toBe(1);
    });
  });

  describe('updateFooterToken', () => {
    it('should update the token of a footer', () => {
      component.addFooter();
      const footerId = component.footers()[0].id;
      component.updateFooterToken(footerId, 'Reviewed-by');
      expect(component.footers()[0].token).toBe('Reviewed-by');
    });
  });

  describe('updateFooterValue', () => {
    it('should update the value of a footer', () => {
      component.addFooter();
      const footerId = component.footers()[0].id;
      component.updateFooterValue(footerId, 'John Doe');
      expect(component.footers()[0].value).toBe('John Doe');
    });
  });

  describe('clearForm', () => {
    it('should reset all fields to defaults', () => {
      component.type.set('fix');
      component.scope.set('test');
      component.description.set('something');
      component.body.set('body text');
      component.isBreakingChange.set(true);
      component.breakingChangeIndicator.set('footer');
      component.breakingChangeDescription.set('breaking change');
      component.addFooter();

      component.clearForm();

      expect(component.type()).toBe('feat');
      expect(component.scope()).toBe('');
      expect(component.description()).toBe('');
      expect(component.body()).toBe('');
      expect(component.isBreakingChange()).toBe(false);
      expect(component.breakingChangeIndicator()).toBe('bang');
      expect(component.breakingChangeDescription()).toBe('');
      expect(component.footers().length).toBe(0);
    });
  });

  describe('copyToClipboard', () => {
    it('should copy commit message to clipboard', async () => {
      const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
      component.type.set('feat');
      component.description.set('test feature');
      component.generateCommitMessage();
      component.copyToClipboard();
      expect(writeTextSpy).toHaveBeenCalledWith('feat: test feature');
    });

    it('should show error when message is empty', () => {
      component.commitMessagePreview.set('');
      component.copyToClipboard();
      expect(component.message()).toBeTruthy();
      expect(component.message()!.type).toBe('error');
    });
  });

  describe('showMessage', () => {
    it('should set and clear message after timeout', async () => {
      vi.useFakeTimers();
      component.showMessage('Success!', 'success');
      expect(component.message()).toEqual({ text: 'Success!', type: 'success' });

      vi.advanceTimersByTime(3100);
      expect(component.message()).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.removeItem('savedCommitMessages');
      component.savedCommitMessages.set([]);
    });

    it('should save a commit message to localStorage', () => {
      component.type.set('feat');
      component.description.set('save test');
      component.generateCommitMessage();
      component.saveCommitMessage();

      const stored = localStorage.getItem('savedCommitMessages');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(1);
      expect(parsed[0].message).toContain('feat: save test');
    });

    it('should not save empty commit message', () => {
      component.commitMessagePreview.set('');
      component.saveCommitMessage();
      const stored = localStorage.getItem('savedCommitMessages');
      expect(stored).toBeNull();
    });

    it('should load saved commit messages', () => {
      const savedData = [{
        id: 'test123',
        message: 'feat: test',
        type: 'feat',
        scope: '',
        description: 'test',
        body: '',
        isBreakingChange: false,
        breakingChangeIndicator: 'bang',
        breakingChangeDescription: '',
        footers: []
      }];
      localStorage.setItem('savedCommitMessages', JSON.stringify(savedData));

      component.loadSavedCommitMessages();
      expect(component.savedCommitMessages().length).toBe(1);
      expect(component.savedCommitMessages()[0].id).toBe('test123');
    });

    it('should handle corrupted localStorage without throwing', () => {
      localStorage.setItem('savedCommitMessages', 'not-valid-json');
      expect(() => component.loadSavedCommitMessages()).not.toThrow();
    });

    it('should remove a saved commit message', () => {
      component.type.set('feat');
      component.description.set('test');
      component.generateCommitMessage();
      component.saveCommitMessage();
      const savedId = component.savedCommitMessages()[0].id;

      component.removeSavedCommitMessage(savedId);
      expect(component.savedCommitMessages().length).toBe(0);
    });

    afterEach(() => {
      localStorage.removeItem('savedCommitMessages');
    });
  });

  describe('loadCommitMessage', () => {
    it('should populate form with saved message data', () => {
      component.clearForm();
      component.type.set('feat');
      component.description.set('saved message');
      component.generateCommitMessage();
      component.saveCommitMessage();
      const savedId = component.savedCommitMessages()[0].id;

      component.clearForm();
      component.loadCommitMessage(savedId);

      expect(component.type()).toBe('feat');
      expect(component.description()).toBe('saved message');
    });

    it('should show error for non-existent ID', () => {
      component.loadCommitMessage('non-existent-id');
      expect(component.message()).toBeTruthy();
      expect(component.message()!.type).toBe('error');
    });
  });
});
