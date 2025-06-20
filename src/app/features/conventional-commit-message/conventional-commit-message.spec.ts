import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConventionalCommitMessage } from './conventional-commit-message';

describe('ConventionalCommitMessage', () => {
  let component: ConventionalCommitMessage;
  let fixture: ComponentFixture<ConventionalCommitMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConventionalCommitMessage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConventionalCommitMessage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
