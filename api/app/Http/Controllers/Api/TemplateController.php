<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            $request->user()->templates()->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        // Check plan limits
        $templateCount = $user->templates()->count();
        if ($templateCount >= $user->template_limit) {
            return response()->json([
                'success' => false,
                'message' => 'Template limit reached. Please upgrade your plan.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string',
            'is_default' => 'sometimes|boolean',
            'styles' => 'sometimes|array',
            'styles.primaryColor' => 'sometimes|string',
            'styles.accentColor' => 'sometimes|string',
            'styles.fontFamily' => 'sometimes|string',
            'styles.headerStyle' => 'sometimes|in:left,center,right',
            'styles.showLogo' => 'sometimes|boolean',
            'styles.showBorder' => 'sometimes|boolean',
            'styles.showWatermark' => 'sometimes|boolean',
            'styles.tableStyle' => 'sometimes|in:simple,striped,bordered',
        ]);

        // If this is the first template or marked as default, unset other defaults
        if ($templateCount === 0 || ($validated['is_default'] ?? false)) {
            $user->templates()->update(['is_default' => false]);
            $validated['is_default'] = true;
        }

        $validated['styles'] = array_merge(
            Template::getDefaultStyles(),
            $validated['styles'] ?? []
        );

        $template = $user->templates()->create($validated);

        return response()->json($template, 201);
    }

    public function show(Request $request, Template $template)
    {
        $this->authorize('view', $template);

        return response()->json($template);
    }

    public function update(Request $request, Template $template)
    {
        $this->authorize('update', $template);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'is_default' => 'sometimes|boolean',
            'styles' => 'sometimes|array',
        ]);

        // Handle default toggling
        if ($validated['is_default'] ?? false) {
            $request->user()->templates()
                ->where('id', '!=', $template->id)
                ->update(['is_default' => false]);
        }

        if (isset($validated['styles'])) {
            $validated['styles'] = array_merge(
                $template->styles ?? Template::getDefaultStyles(),
                $validated['styles']
            );
        }

        $template->update($validated);

        return response()->json($template);
    }

    public function destroy(Request $request, Template $template)
    {
        $this->authorize('delete', $template);

        $wasDefault = $template->is_default;
        $template->delete();

        // If deleted template was default, make another one default
        if ($wasDefault) {
            $request->user()->templates()
                ->first()
                ?->update(['is_default' => true]);
        }

        return response()->json(['success' => true]);
    }

    public function setDefault(Request $request, Template $template)
    {
        $this->authorize('update', $template);

        $request->user()->templates()->update(['is_default' => false]);
        $template->update(['is_default' => true]);

        return response()->json($template);
    }
}
