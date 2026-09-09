<?php

namespace App\Mail;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invitation $invitation) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'You have been invited to RIS ERP');
    }

    public function content(): Content
    {
        $acceptUrl = config('app.frontend_url', config('app.url')) . '/accept-invite/' . $this->invitation->token;

        return new Content(
            view: 'emails.invitation',
            with: [
                'inviterName' => $this->invitation->inviter?->name ?? 'Admin',
                'acceptUrl'   => $acceptUrl,
                'expiresAt'   => $this->invitation->expires_at->format('d M Y'),
                'role'        => $this->invitation->role?->display_name,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
