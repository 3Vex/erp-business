<?php

namespace App\Http\Controllers\Api;

use App\Mail\UserInvitation;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends BaseApiController
{
    /**
     * Send an invitation email (admin only)
     */
    public function invite(Request $request): JsonResponse
    {
        $error = $this->validate($request->all(), [
            'email'   => 'required|email|unique:users,email',
            'name'    => 'nullable|string|max:100',
            'role_id' => 'nullable|integer|exists:roles,id',
        ]);
        if ($error) return $error;

        // Cancel any existing pending invite for this email
        Invitation::where('email', $request->email)
            ->whereNull('accepted_at')
            ->delete();

        $token = Str::random(64);

        $invitation = Invitation::create([
            'email'      => $request->email,
            'name'       => $request->name,
            'token'      => $token,
            'role_id'    => $request->role_id,
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($request->email)->send(new UserInvitation($invitation));

        return $this->respondCreated([
            'message'    => 'Invitation sent successfully.',
            'expires_at' => $invitation->expires_at,
        ]);
    }

    /**
     * List all sent invitations (admin only)
     */
    public function index(): JsonResponse
    {
        $invitations = Invitation::with(['inviter:id,name', 'role:id,display_name'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($i) => [
                'id'           => $i->id,
                'email'        => $i->email,
                'name'         => $i->name,
                'role'         => $i->role?->display_name,
                'invited_by'   => $i->inviter?->name,
                'expires_at'   => $i->expires_at,
                'accepted_at'  => $i->accepted_at,
                'status'       => $i->accepted_at ? 'accepted' : ($i->expires_at->isFuture() ? 'pending' : 'expired'),
            ]);

        return $this->respondSuccess('Invitations retrieved', $invitations);
    }

    /**
     * Resend an invitation
     */
    public function resend(int $id, Request $request): JsonResponse
    {
        $invitation = Invitation::whereNull('accepted_at')->find($id);
        if (! $invitation) {
            return $this->respondNotFound('Invitation not found or already accepted.');
        }

        $invitation->update([
            'token'      => Str::random(64),
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($invitation->email)->send(new UserInvitation($invitation));

        return $this->respondSuccess('Invitation resent.');
    }

    /**
     * Cancel / delete an invitation
     */
    public function destroy(int $id): JsonResponse
    {
        $invitation = Invitation::whereNull('accepted_at')->find($id);
        if (! $invitation) {
            return $this->respondNotFound('Invitation not found or already accepted.');
        }

        $invitation->delete();

        return $this->respondSuccess('Invitation cancelled.');
    }

    /**
     * Validate an invitation token (public — called from the accept page)
     */
    public function validate_token(string $token): JsonResponse
    {
        $invitation = Invitation::with('role:id,display_name')
            ->where('token', $token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $invitation) {
            return $this->respondError('This invitation link is invalid or has expired.', 422);
        }

        return $this->respondSuccess('Valid invitation', [
            'email' => $invitation->email,
            'name'  => $invitation->name,
            'role'  => $invitation->role?->display_name,
        ]);
    }

    /**
     * Accept an invitation — create the user account (public)
     */
    public function accept(Request $request): JsonResponse
    {
        $error = $this->validate($request->all(), [
            'token'                 => 'required|string',
            'name'                  => 'required|string|max:100',
            'password'              => 'required|min:8|confirmed',
        ]);
        if ($error) return $error;

        $invitation = Invitation::with('role')
            ->where('token', $request->token)
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $invitation) {
            return $this->respondError('This invitation link is invalid or has expired.', 422);
        }

        // Check email not already taken
        if (User::where('email', $invitation->email)->exists()) {
            return $this->respondError('An account with this email already exists.', 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $invitation->email,
            'password' => Hash::make($request->password),
        ]);

        // Assign role
        if ($invitation->role_id) {
            $user->roles()->attach($invitation->role_id, [
                'assigned_at' => now(),
                'assigned_by' => $invitation->invited_by,
            ]);
        }

        // Mark invitation as accepted
        $invitation->update(['accepted_at' => now()]);

        $token = $user->createToken('api-token')->plainTextToken;
        $user->load('roles');

        return $this->respond([
            'success' => true,
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }
}
