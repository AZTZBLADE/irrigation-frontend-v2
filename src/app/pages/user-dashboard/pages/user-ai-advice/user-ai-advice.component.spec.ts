import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAiAdviceComponent } from './user-ai-advice.component';

describe('UserAiAdviceComponent', () => {
  let component: UserAiAdviceComponent;
  let fixture: ComponentFixture<UserAiAdviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAiAdviceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserAiAdviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
