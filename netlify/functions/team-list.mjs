import { readStateEntry, response } from "./_shared.mjs";

const DEFAULT_TEAM = [
  { id: "chelo", label: "Chelo", role: "Encargado", color: "#416877", active: true, canLogin: true, locationId: "barcelona" },
  { id: "sebastian", label: "Sebastian", role: "Barista", color: "#2d4f5c", active: true, canLogin: true, locationId: "barcelona" },
  { id: "third", label: "Paloma", role: "Barista", color: "#c46d47", active: true, canLogin: true, locationId: "barcelona" },
  { id: "pablo", label: "Pablo", role: "Cobertura dueno", color: "#8a4a2f", active: true, canLogin: false, system: true, locationId: "barcelona" },
  { id: "bonnie", label: "Bonnie", role: "Barista", color: "#6f7f46", active: true, canLogin: true, locationId: "madrid" },
  { id: "micaela", label: "Micaela", role: "Encargada", color: "#8d5a73", active: true, canLogin: true, locationId: "madrid" },
  { id: "perla", label: "Perla", role: "Barista", color: "#547f87", active: true, canLogin: true, locationId: "madrid" },
  { id: "guillermo", label: "Guillermo", role: "Barista", color: "#9a7041", active: true, canLogin: true, locationId: "madrid" },
];

export default async () => {
  const { state } = await readStateEntry();
  const storedEmployees = Array.isArray(state?.employees) && state.employees.length
    ? state.employees
    : [];
  const byId = new Map(DEFAULT_TEAM.map((employee) => [employee.id, employee]));
  storedEmployees.forEach((employee) => {
    byId.set(employee.id, {
      ...(byId.get(employee.id) || {}),
      ...employee,
    });
  });
  const employees = [...byId.values()];
  return response({
    ok: true,
    employees: employees
      .filter((employee) => employee.active !== false)
      .map((employee) => ({
        id: employee.id,
        label: employee.label,
        role: employee.role,
        color: employee.color,
        locationId: employee.locationId || "barcelona",
        active: true,
        canLogin: employee.canLogin !== false,
        system: !!employee.system,
        activeFrom: employee.activeFrom || null,
      })),
  });
};
