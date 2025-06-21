/**
 * @fileoverview Component for creating and managing conventional commit messages.
 *
 * This component uses Material Design components for input and interaction.
 * It facilitates generating and storing commit messages adhering to a convention,
 * supporting features such as commit type selection, footer addition, saving messages locally,
 * and displaying message previews.
 *
 * Preferred use: Include in templates where conventional commit message creation
 * is necessary, such as in Git workflows or build tools.
 */

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

interface CommitFooter {
  id: number;
  token: string;
  value: string;
}

interface SavedCommitMessage {
  id: string;
  message: string;
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
  type = signal<string>('feat');
  scope = signal<string>('');
  description = signal<string>('');
  body = signal<string>('');
  isBreakingChange = signal<boolean>(false);
  breakingChangeIndicator = signal<string>('bang');
  breakingChangeDescription = signal<string>('');
  footers = signal<CommitFooter[]>([]);
  nextFooterId = signal<number>(0);

  commitMessagePreview = signal<string>('');
  message = signal<{ text: string, type: 'success' | 'error' } | null>(null);

  savedCommitMessages = signal<SavedCommitMessage[]>([]);
  private readonly LOCAL_STORAGE_KEY = 'savedCommitMessages';

  constructor() {
    effect(() => {
      this.generateCommitMessage();
    }, { allowSignalWrites: true });
  }

  /**
   * Component lifecycle method to initiate loading saved commit messages.
   */
  ngOnInit(): void {
    this.loadSavedCommitMessages();
  }

  /**
   * Generates the complete commit message from the current state of the component.
   * Builds the header, body, and footers, considering potential breaking changes.
   */
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
      messageParts.push('');
      messageParts.push(body);
    }

    const commitFooters: string[] = [];
    if (isBreaking && breakingIndicator === 'footer' && breakingDesc) {
      commitFooters.push(`BREAKING CHANGE: ${breakingDesc}`);
    }

    this.footers().forEach(footer => {
      if (footer.token.trim() && footer.value.trim()) {
        commitFooters.push(`${footer.token.trim()}: ${footer.value.trim()}`);
      }
    });

    if (commitFooters.length > 0) {
      messageParts.push('');
      messageParts.push(...commitFooters);
    }

    this.commitMessagePreview.set(messageParts.join('\n'));
  }

  /**
   * Adds a new editable footer item to the commit message.
   */
  addFooter(): void {
    this.footers.update(currentFooters => [
      ...currentFooters,
      { id: this.nextFooterId(), token: '', value: '' }
    ]);

    this.nextFooterId.update(id => id + 1);
  }

  /**
   * Removes a footer item from the commit message based on its ID.
   * @param idToRemove The ID of the footer to be removed.
   */
  removeFooter(idToRemove: number): void {
    this.footers.update(currentFooters =>
      currentFooters.filter(footer => footer.id !== idToRemove)
    );
  }

  /**
   * Updates the token (e.g., 'lemsreq', 'type') of an existing footer item.
   * @param id The ID of the footer to update.
   * @param value The new token value.
   */
  updateFooterToken(id: number, value: string): void {
    this.footers.update(currentFooters =>
      currentFooters.map(footer =>
        footer.id === id ? { ...footer, token: value } : footer
      )
    );
  }

  /**
   * Updates the value (e.g., description, notes) of an existing footer item.
   * @param id The ID of the footer to update.
   * @param value The new value for the footer.
   */
  updateFooterValue(id: number, value: string): void {
    this.footers.update(currentFooters =>
      currentFooters.map(footer =>
        footer.id === id ? { ...footer, value: value } : footer
      )
    );
  }

  /**
   * Generates a unique identifier for a new commit message entry.
   * @returns A unique string.
   */
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Saves the current commit message to local storage.
   */
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
      footers: this.footers().map(f => ({ ...f }))
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

  /**
   * Loads saved commit messages from local storage.
   */
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

  /**
   * Loads a specific commit message by its ID from saved messages.
   * Fills the component state with the loaded message data.
   * @param idToLoad The unique ID of the commit message to load.
   */
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

      this.footers.set(messageToLoad.footers.map(f => ({ ...f })));

      const maxFooterId = messageToLoad.footers.reduce((max, f) => Math.max(max, f.id), -1);
      this.nextFooterId.set(maxFooterId + 1);

      this.showMessage('Pesan commit berhasil dimuat ke editor!', 'success');
    } else {
      this.showMessage('Pesan commit tidak ditemukan.', 'error');
    }
  }

  /**
   * Removes a saved commit message from local storage.
   * @param idToRemove The unique ID of the commit message to remove.
   */
  removeSavedCommitMessage(idToRemove: string): void {
    this.savedCommitMessages.update(messages => {
      const updatedMessages = messages.filter(msg => msg.id !== idToRemove);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    this.showMessage('Pesan commit berhasil dihapus!', 'success');
  }

  /**
   * Copies the current commit message preview to the clipboard.
   */
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

  /**
   * Resets all form fields to their default states.
   */
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

  /**
   * Displays a temporary message indicating success or error.
   * @param text The message to display.
   * @param type Either 'success' or 'error' that dictates the styling.
   */
  showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => {
      this.message.set(null);
    }, 3000);
  }
}
