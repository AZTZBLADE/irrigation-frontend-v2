import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService } from '../../../../core/chatbot.service';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

@Component({
  selector: 'app-user-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-chatbot.component.html',
  styleUrl: './user-chatbot.component.scss',
})
export class UserChatbotComponent {
  prompt = '';
  loading = false;
  analyzing = false;
  selectedFile: File | null = null;

  messages: ChatMessage[] = [
    {
      sender: 'bot',
      text: 'Hello 👋 Ask me about your plants, irrigation, or upload an image for disease analysis.',
    },
  ];

  constructor(private chatbotService: ChatbotService) {}

  sendMessage(): void {
    const text = this.prompt.trim();
    if (!text || this.loading) return;

    this.messages.push({ sender: 'user', text });
    this.prompt = '';
    this.loading = true;

    this.chatbotService.chat(text).subscribe({
      next: (res: any) => {
        this.messages.push({
          sender: 'bot',
          text: typeof res === 'string' ? res : JSON.stringify(res),
        });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({
          sender: 'bot',
          text: 'Failed to get response from chatbot.',
        });
        this.loading = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  analyzeImage(): void {
    if (!this.selectedFile || this.analyzing) return;

    this.messages.push({
      sender: 'user',
      text: `Image selected: ${this.selectedFile.name}`,
    });

    this.analyzing = true;

    this.chatbotService.analyzeImage(this.selectedFile).subscribe({
      next: (res: any) => {
        const result =
          typeof res === 'string'
            ? res
            : res?.result || res?.message || JSON.stringify(res);

        this.messages.push({
          sender: 'bot',
          text: result,
        });

        this.analyzing = false;
      },
      error: (err) => {
        console.error(err);
        this.messages.push({
          sender: 'bot',
          text: 'Failed to analyze image.',
        });
        this.analyzing = false;
      },
    });
  }
}