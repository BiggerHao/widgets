import { View } from "vega";
import { Logger } from "falcon-vis";

export class EmptyLogger<V extends string> implements Logger<V> {
  public attach(name: V, view: View) {
      // The EmptyLogger is only used to enable the brushMouse signal.
      // The signal is hard-coded in the falcon codebase.
  }
}