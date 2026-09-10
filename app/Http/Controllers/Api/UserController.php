<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends BaseApiController
{
    public function __construct()
    {
        parent::__construct(new User);
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles');

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = $request->query('per_page', 15);
        $users = $query->orderBy('name')->paginate(min($perPage, 100));

        return $this->respond([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $error = $this->validate($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'nullable|integer|exists:roles,id',
        ]);
        if ($error) {
            return $error;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        if ($request->filled('role_id')) {
            $user->roles()->sync([
                $request->role_id => [
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id(),
                ],
            ]);
            $user->flushPermissionCache();
        }

        return $this->respondCreated($user->load('roles'), 'User created successfully');
    }

    public function show(int $user): JsonResponse
    {
        $record = User::with('roles')->find($user);
        if (! $record) {
            return $this->respondNotFound();
        }

        return $this->respond(['success' => true, 'data' => $record]);
    }

    public function update(Request $request, int $user): JsonResponse
    {
        $record = User::find($user);
        if (! $record) {
            return $this->respondNotFound();
        }

        $error = $this->validate($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$user,
            'password' => 'nullable|string|min:6',
            'role_id' => 'nullable|integer|exists:roles,id',
        ]);
        if ($error) {
            return $error;
        }

        $data = $request->only(['name', 'email']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $record->update($data);

        if ($request->has('role_id')) {
            if ($request->filled('role_id')) {
                $record->roles()->sync([
                    $request->role_id => [
                        'assigned_at' => now(),
                        'assigned_by' => auth()->id(),
                    ],
                ]);
            } else {
                $record->roles()->detach();
            }
            $record->flushPermissionCache();
        }

        return $this->respondSuccess('User updated', $record->fresh('roles'));
    }

    public function destroy(int $user): JsonResponse
    {
        $record = User::find($user);
        if (! $record) {
            return $this->respondNotFound();
        }

        if ($record->id === auth()->id()) {
            return $this->respondError('Cannot delete your own account', 422);
        }

        $record->delete();

        return $this->respondSuccess('User deleted');
    }
}
