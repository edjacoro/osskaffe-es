import { readStateEntry, response } from "./_shared.mjs";

const DEFAULT_TEAM = [
  { id: "chelo", label: "Chelo", role: "Encargado", color: "#416877", active: true, canLogin: true },
  { id: "sebastian", label: "Sebastian", role: "Barista", color: "#2d4f5c", active: true, canLogin: true },
  { id: "third", label: "Paloma", role: "Barista", color: "#c46d47", active: true, canLogin: true },
  { id: "pablo", label: "Pablo", role: "Cobertura dueno", color: "#8a4a2f", active: true, canLogin: false, system: true },
];

export default async () => {
  const { state } = await readStateEntry();
  const employees = Array.isArray(state?.employees) && state.employees.length
    ? state.employees
    : DEFAULT_TEAM;
  return response({
    ok: true,
    employees: employees
      .filter((employee) => employee.active !== false)
      .map((employee) => ({
        id: employee.id,
        label: employee.label,
        role: employee.role,
        color: employee.color,
        active: true,
        canLogin: employee.canLogin !== false,
        system: !!employee.system,
        activeFrom: employee.activeFrom || null,
      })),
  });
};
