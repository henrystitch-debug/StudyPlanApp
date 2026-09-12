import { updateSettings } from "@/lib/db/settings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ settingsId: string, pushNotifs: boolean, darkMode: boolean }> }
) {
  const { settingsId: settingsIdParam, pushNotifs: pushNotifsParam, darkMode: darkModeParam } = await params;
  const settingsId = Number(settingsIdParam);
  const pushNotifs = pushNotifsParam;
  const darkMode = darkModeParam;

  if (!settingsId || Number.isNaN(settingsId) || !pushNotifs || !darkMode) {
    return Response.json({ error: "settings information is required" }, { status: 400 });
  }

  const updatedSettings = await updateSettings(settingsId, pushNotifs, darkMode);

  if (!updatedSettings) {
    return Response.json({ error: "Event not found or no fields provided" }, { status: 404 });
  }

  return Response.json({ settings: updatedSettings });
}