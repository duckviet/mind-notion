import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  KeyboardCoordinateGetter,
} from "@dnd-kit/core";

export interface UseCustomDndSensorsOptions {
  /**
   * Disable all sensors
   */
  disabled?: boolean;

  /**
   * Distance in pixels required to activate pointer drag (default: 8)
   */
  activationDistance?: number;

  /**
   * Keyboard codes to trigger drag start (default: [] - disabled)
   */
  startKeys?: string[];

  /**
   * Keyboard codes to cancel drag (default: ["Escape"])
   */
  cancelKeys?: string[];

  /**
   * Keyboard codes to end drag (default: [] - disabled)
   */
  endKeys?: string[];

  /**
   * Keyboard codes for navigation (default: Arrow keys)
   */
  navigationKeys?: {
    up?: string[];
    down?: string[];
    left?: string[];
    right?: string[];
  };

  /**
   * Coordinate getter for keyboard navigation (used for sortable)
   */
  coordinateGetter?: KeyboardCoordinateGetter;
}

/**
 * Custom hook for configuring dnd-kit sensors
 * Removes Space and Enter keys by default to prevent conflicts with typing
 */
export function useCustomDndSensors(options: UseCustomDndSensorsOptions = {}) {
  const {
    disabled = false,
    activationDistance = 8,
    startKeys = [],
    cancelKeys = ["Escape"],
    endKeys = [],
    navigationKeys = {
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
    coordinateGetter,
  } = options;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: disabled ? 999999 : activationDistance,
      },
    }),
    useSensor(KeyboardSensor, {
      keyboardCodes: {
        start: startKeys,
        cancel: cancelKeys,
        end: endKeys,
        up: navigationKeys.up || [],
        down: navigationKeys.down || [],
        left: navigationKeys.left || [],
        right: navigationKeys.right || [],
      },
      coordinateGetter,
    })
  );

  return sensors;
}
