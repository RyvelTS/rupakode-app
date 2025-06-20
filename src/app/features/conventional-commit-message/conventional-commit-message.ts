// src/app/conventional-commit-message/conventional-commit-message.component.ts
import { Component, OnInit, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

// Definisi Interface untuk Footer
interface CommitFooter {
  id: number;
  token: string;
  value: string;
}

// NEW: Interface for Saved Commit Messages
interface SavedCommitMessage {
  id: string; // Unique ID for each saved message (UUID or timestamp)
  message: string; // The generated commit message
  // Optionally, you can save the full form state to reload accurately
  type: string;
  scope: string;
  description: string;
  body: string;
  isBreakingChange: boolean;
  breakingChangeIndicator: string;
  breakingChangeDescription: string;
  footers: CommitFooter[];
}

@Component({
  selector: 'app-conventional-commit-message',
  standalone: true,
  imports: [
    FormsModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './conventional-commit-message.html',
  styleUrls: ['./conventional-commit-message.scss']
})
export class ConventionalCommitMessage implements OnInit {

  // --- Signals untuk mengelola state form inputs ---
  type = signal<string>('feat');
  scope = signal<string>('');
  description = signal<string>('');
  body = signal<string>('');
  isBreakingChange = signal<boolean>(false);
  breakingChangeIndicator = signal<string>('bang');
  breakingChangeDescription = signal<string>('');
  footers = signal<CommitFooter[]>([]);
  nextFooterId = signal<number>(0);

  // --- Signal untuk output dan pesan ---
  commitMessagePreview = signal<string>('');
  message = signal<{ text: string, type: 'success' | 'error' } | null>(null);

  // NEW: Signal for saved commit messages
  savedCommitMessages = signal<SavedCommitMessage[]>([]);
  private readonly LOCAL_STORAGE_KEY = 'savedCommitMessages'; // Key for local storage

  constructor() {
    effect(() => {
      this.generateCommitMessage();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // NEW: Load saved messages when the component initializes
    this.loadSavedCommitMessages();
  }

  // --- Core Logic ---

  generateCommitMessage(): void {
    const type = this.type();
    const scope = this.scope().trim();
    const description = this.description().trim();
    const body = this.body().trim();
    const isBreaking = this.isBreakingChange();
    const breakingIndicator = this.breakingChangeIndicator();
    const breakingDesc = this.breakingChangeDescription().trim();

    let header = type;
    if (scope) {
      header += `(${scope})`;
    }
    if (isBreaking && breakingIndicator === 'bang') {
      header += '!';
    }
    header += `: ${description}`;

    let messageParts: string[] = [header];

    if (body) {
      messageParts.push(''); // Baris kosong sebelum body
      messageParts.push(body);
    }

    const commitFooters: string[] = [];
    // Tambahkan footer breaking change jika berlaku
    if (isBreaking && breakingIndicator === 'footer' && breakingDesc) {
      commitFooters.push(`BREAKING CHANGE: ${breakingDesc}`);
    }

    // Tambahkan footer dinamis
    this.footers().forEach(footer => {
      if (footer.token.trim() && footer.value.trim()) {
        commitFooters.push(`${footer.token.trim()}: ${footer.value.trim()}`);
      }
    });

    if (commitFooters.length > 0) {
      messageParts.push(''); // Baris kosong sebelum footers
      messageParts.push(...commitFooters);
    }

    this.commitMessagePreview.set(messageParts.join('\n'));
  }

  addFooter(): void {
    this.footers.update(currentFooters => [
      ...currentFooters,
      { id: this.nextFooterId(), token: '', value: '' }
    ]);
    this.nextFooterId.update(id => id + 1);
  }

  removeFooter(idToRemove: number): void {
    this.footers.update(currentFooters =>
      currentFooters.filter(footer => footer.id !== idToRemove)
    );
  }

  updateFooterToken(id: number, value: string): void {
    this.footers.update(currentFooters =>
      currentFooters.map(footer =>
        footer.id === id ? { ...footer, token: value } : footer
      )
    );
  }

  updateFooterValue(id: number, value: string): void {
    this.footers.update(currentFooters =>
      currentFooters.map(footer =>
        footer.id === id ? { ...footer, value: value } : footer
      )
    );
  }

  // --- NEW: Local Storage Functionality ---

  // Generate a simple unique ID for saved messages
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  saveCommitMessage(): void {
    const currentMessage: SavedCommitMessage = {
      id: this.generateUniqueId(),
      message: this.commitMessagePreview(),
      type: this.type(),
      scope: this.scope(),
      description: this.description(),
      body: this.body(),
      isBreakingChange: this.isBreakingChange(),
      breakingChangeIndicator: this.breakingChangeIndicator(),
      breakingChangeDescription: this.breakingChangeDescription(),
      footers: this.footers().map(f => ({ ...f })) // Deep copy footers
    };

    if (!currentMessage.message.trim()) {
      this.showMessage('Pesan commit kosong, tidak bisa disimpan.', 'error');
      return;
    }

    this.savedCommitMessages.update(messages => {
      const updatedMessages = [...messages, currentMessage];
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    this.showMessage('Pesan commit berhasil disimpan!', 'success');
  }

  loadSavedCommitMessages(): void {
    try {
      const storedMessages = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (storedMessages) {
        const messages: SavedCommitMessage[] = JSON.parse(storedMessages);
        this.savedCommitMessages.set(messages);
      }
    } catch (e) {
      console.error('Error loading commit messages from local storage:', e);
      this.showMessage('Gagal memuat pesan tersimpan.', 'error');
    }
  }

  loadCommitMessage(idToLoad: string): void {
    const messageToLoad = this.savedCommitMessages().find(msg => msg.id === idToLoad);
    if (messageToLoad) {
      this.type.set(messageToLoad.type);
      this.scope.set(messageToLoad.scope);
      this.description.set(messageToLoad.description);
      this.body.set(messageToLoad.body);
      this.isBreakingChange.set(messageToLoad.isBreakingChange);
      this.breakingChangeIndicator.set(messageToLoad.breakingChangeIndicator);
      this.breakingChangeDescription.set(messageToLoad.breakingChangeDescription);
      // Ensure footers are deep copied to avoid mutation issues
      this.footers.set(messageToLoad.footers.map(f => ({ ...f })));
      // Reset nextFooterId based on loaded footers to prevent ID collisions on new adds
      const maxFooterId = messageToLoad.footers.reduce((max, f) => Math.max(max, f.id), -1);
      this.nextFooterId.set(maxFooterId + 1);

      this.showMessage('Pesan commit berhasil dimuat ke editor!', 'success');
    } else {
      this.showMessage('Pesan commit tidak ditemukan.', 'error');
    }
  }

  removeSavedCommitMessage(idToRemove: string): void {
    this.savedCommitMessages.update(messages => {
      const updatedMessages = messages.filter(msg => msg.id !== idToRemove);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    this.showMessage('Pesan commit berhasil dihapus!', 'success');
  }

  // --- Utility Functions ---

  copyToClipboard(): void {
    const textToCopy = this.commitMessagePreview();
    if (!textToCopy) {
      this.showMessage('Tidak ada yang bisa disalin!', 'error');
      return;
    }

    navigator.clipboard.writeText(textToCopy)
      .then(() => this.showMessage('Pesan commit berhasil disalin!', 'success'))
      .catch(err => {
        console.error('Gagal menyalin teks: ', err);
        this.showMessage('Gagal menyalin pesan.', 'error');
      });
  }

  clearForm(): void {
    this.type.set('feat');
    this.scope.set('');
    this.description.set('');
    this.body.set('');
    this.isBreakingChange.set(false);
    this.breakingChangeIndicator.set('bang');
    this.breakingChangeDescription.set('');
    this.footers.set([]);
    this.nextFooterId.set(0);
    this.showMessage('Formulir berhasil dihapus!', 'success');
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => {
      this.message.set(null);
    }, 3000);
  }
}
