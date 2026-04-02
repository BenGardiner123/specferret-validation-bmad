#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// ../../node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// ../../node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.endsWith("...")) {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// ../../node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (option.description) {
          return `${option.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatItemList(heading, items, helper) {
      if (items.length === 0)
        return [];
      return [helper.styleTitle(heading), ...items, ""];
    }
    groupItems(unsortedItems, visibleItems, getGroup) {
      const result = new Map;
      unsortedItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group))
          result.set(group, []);
      });
      visibleItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group)) {
          result.set(group, []);
        }
        result.get(group).push(item);
      });
      return result;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      output = output.concat(this.formatItemList("Arguments:", argumentList, helper));
      const optionGroups = this.groupItems(cmd.options, helper.visibleOptions(cmd), (option) => option.helpGroupHeading ?? "Options:");
      optionGroups.forEach((options2, group) => {
        const optionList = options2.map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList(group, optionList, helper));
      });
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList("Global Options:", globalOptionList, helper));
      }
      const commandGroups = this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub) => sub.helpGroup() || "Commands:");
      commandGroups.forEach((commands, group) => {
        const commandList = commands.map((sub) => {
          return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub)));
        });
        output = output.concat(this.formatItemList(group, commandList, helper));
      });
      return output.join(`
`);
    }
    displayWidth(str2) {
      return stripColor(str2).length;
    }
    styleTitle(str2) {
      return str2;
    }
    styleUsage(str2) {
      return str2.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str2) {
      return this.styleDescriptionText(str2);
    }
    styleOptionDescription(str2) {
      return this.styleDescriptionText(str2);
    }
    styleSubcommandDescription(str2) {
      return this.styleDescriptionText(str2);
    }
    styleArgumentDescription(str2) {
      return this.styleDescriptionText(str2);
    }
    styleDescriptionText(str2) {
      return str2;
    }
    styleOptionTerm(str2) {
      return this.styleOptionText(str2);
    }
    styleSubcommandTerm(str2) {
      return str2.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str2) {
      return this.styleArgumentText(str2);
    }
    styleOptionText(str2) {
      return str2;
    }
    styleArgumentText(str2) {
      return str2;
    }
    styleSubcommandText(str2) {
      return str2;
    }
    styleCommandText(str2) {
      return str2;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str2) {
      return /\n[^\S\r\n]/.test(str2);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str2, width) {
      if (width < this.minWidthToWrap)
        return str2;
      const rawLines = str2.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str2) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str2.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// ../../node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
      this.helpGroupHeading = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    helpGroup(heading) {
      this.helpGroupHeading = heading;
      return this;
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options2) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options2.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str2) {
    return str2.split("-").reduce((str3, word) => {
      return str3 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// ../../node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// ../../node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("events").EventEmitter;
  var childProcess = __require("child_process");
  var path = __require("path");
  var fs = __require("fs");
  var process2 = __require("process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str2) => process2.stdout.write(str2),
        writeErr: (str2) => process2.stderr.write(str2),
        outputError: (str2, write) => write(str2),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str2) => stripColor(str2)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
      this._helpGroupHeading = undefined;
      this._defaultCommandGroup = undefined;
      this._defaultOptionGroup = undefined;
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      this._outputConfiguration = {
        ...this._outputConfiguration,
        ...configuration
      };
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, parseArg, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof parseArg === "function") {
        argument.default(defaultValue).argParser(parseArg);
      } else {
        argument.default(parseArg);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument?.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        if (enableOrNameAndArgs && this._defaultCommandGroup) {
          this._initCommandGroup(this._getHelpCommand());
        }
        return this;
      }
      const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      if (enableOrNameAndArgs || description)
        this._initCommandGroup(helpCommand);
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      this._initCommandGroup(helpCommand);
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {}
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this._initOptionGroup(option);
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this._initCommandGroup(command);
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._collectValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise?.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent?.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(args) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      const negativeNumberArg = (arg) => {
        if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg))
          return false;
        return !this._getCommandAndAncestors().some((cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short)));
      };
      let activeVariadicOption = null;
      let activeGroup = null;
      let i = 0;
      while (i < args.length || activeGroup) {
        const arg = activeGroup ?? args[i++];
        activeGroup = null;
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args.slice(i));
          break;
        }
        if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args[i++];
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                value = args[i++];
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              activeGroup = `-${arg.slice(2)}`;
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            unknown.push(...args.slice(i));
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg, ...args.slice(i));
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg, ...args.slice(i));
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg, ...args.slice(i));
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str2, flags, description) {
      if (str2 === undefined)
        return this._version;
      this._version = str2;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str2}
`);
        this._exit(0, "commander.version", str2);
      });
      return this;
    }
    description(str2, argsDescription) {
      if (str2 === undefined && argsDescription === undefined)
        return this._description;
      this._description = str2;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str2) {
      if (str2 === undefined)
        return this._summary;
      this._summary = str2;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str2) {
      if (str2 === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str2;
      return this;
    }
    name(str2) {
      if (str2 === undefined)
        return this._name;
      this._name = str2;
      return this;
    }
    helpGroup(heading) {
      if (heading === undefined)
        return this._helpGroupHeading ?? "";
      this._helpGroupHeading = heading;
      return this;
    }
    commandsGroup(heading) {
      if (heading === undefined)
        return this._defaultCommandGroup ?? "";
      this._defaultCommandGroup = heading;
      return this;
    }
    optionsGroup(heading) {
      if (heading === undefined)
        return this._defaultOptionGroup ?? "";
      this._defaultOptionGroup = heading;
      return this;
    }
    _initOptionGroup(option) {
      if (this._defaultOptionGroup && !option.helpGroupHeading)
        option.helpGroup(this._defaultOptionGroup);
    }
    _initCommandGroup(cmd) {
      if (this._defaultCommandGroup && !cmd.helpGroup())
        cmd.helpGroup(this._defaultCommandGroup);
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str2) => this._outputConfiguration.writeErr(str2);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str2) => this._outputConfiguration.writeOut(str2);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str2) => {
        if (!hasColors)
          str2 = this._outputConfiguration.stripColor(str2);
        return baseWrite(str2);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          if (this._helpOption === null)
            this._helpOption = undefined;
          if (this._defaultOptionGroup) {
            this._initOptionGroup(this._getHelpOption());
          }
        } else {
          this._helpOption = null;
        }
        return this;
      }
      this._helpOption = this.createOption(flags ?? "-h, --help", description ?? "display help for command");
      if (flags || description)
        this._initOptionGroup(this._helpOption);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      this._initOptionGroup(option);
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// ../../node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// ../../node_modules/commander/esm.mjs
var import__, program, createCommand, createArgument, createOption, CommanderError, InvalidArgumentError, InvalidOptionArgumentError, Command, Argument, Option, Help;
var init_esm = __esm(() => {
  import__ = __toESM(require_commander(), 1);
  ({
    program,
    createCommand,
    createArgument,
    createOption,
    CommanderError,
    InvalidArgumentError,
    InvalidOptionArgumentError,
    Command,
    Argument,
    Option,
    Help
  } = import__.default);
});

// ../../node_modules/kind-of/index.js
var require_kind_of = __commonJS((exports, module) => {
  var toString = Object.prototype.toString;
  module.exports = function kindOf(val) {
    if (val === undefined)
      return "undefined";
    if (val === null)
      return "null";
    var type = typeof val;
    if (type === "boolean")
      return "boolean";
    if (type === "string")
      return "string";
    if (type === "number")
      return "number";
    if (type === "symbol")
      return "symbol";
    if (type === "function") {
      return isGeneratorFn(val) ? "generatorfunction" : "function";
    }
    if (isArray(val))
      return "array";
    if (isBuffer(val))
      return "buffer";
    if (isArguments(val))
      return "arguments";
    if (isDate(val))
      return "date";
    if (isError(val))
      return "error";
    if (isRegexp(val))
      return "regexp";
    switch (ctorName(val)) {
      case "Symbol":
        return "symbol";
      case "Promise":
        return "promise";
      case "WeakMap":
        return "weakmap";
      case "WeakSet":
        return "weakset";
      case "Map":
        return "map";
      case "Set":
        return "set";
      case "Int8Array":
        return "int8array";
      case "Uint8Array":
        return "uint8array";
      case "Uint8ClampedArray":
        return "uint8clampedarray";
      case "Int16Array":
        return "int16array";
      case "Uint16Array":
        return "uint16array";
      case "Int32Array":
        return "int32array";
      case "Uint32Array":
        return "uint32array";
      case "Float32Array":
        return "float32array";
      case "Float64Array":
        return "float64array";
    }
    if (isGeneratorObj(val)) {
      return "generator";
    }
    type = toString.call(val);
    switch (type) {
      case "[object Object]":
        return "object";
      case "[object Map Iterator]":
        return "mapiterator";
      case "[object Set Iterator]":
        return "setiterator";
      case "[object String Iterator]":
        return "stringiterator";
      case "[object Array Iterator]":
        return "arrayiterator";
    }
    return type.slice(8, -1).toLowerCase().replace(/\s/g, "");
  };
  function ctorName(val) {
    return typeof val.constructor === "function" ? val.constructor.name : null;
  }
  function isArray(val) {
    if (Array.isArray)
      return Array.isArray(val);
    return val instanceof Array;
  }
  function isError(val) {
    return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
  }
  function isDate(val) {
    if (val instanceof Date)
      return true;
    return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
  }
  function isRegexp(val) {
    if (val instanceof RegExp)
      return true;
    return typeof val.flags === "string" && typeof val.ignoreCase === "boolean" && typeof val.multiline === "boolean" && typeof val.global === "boolean";
  }
  function isGeneratorFn(name, val) {
    return ctorName(name) === "GeneratorFunction";
  }
  function isGeneratorObj(val) {
    return typeof val.throw === "function" && typeof val.return === "function" && typeof val.next === "function";
  }
  function isArguments(val) {
    try {
      if (typeof val.length === "number" && typeof val.callee === "function") {
        return true;
      }
    } catch (err) {
      if (err.message.indexOf("callee") !== -1) {
        return true;
      }
    }
    return false;
  }
  function isBuffer(val) {
    if (val.constructor && typeof val.constructor.isBuffer === "function") {
      return val.constructor.isBuffer(val);
    }
    return false;
  }
});

// ../../node_modules/is-extendable/index.js
var require_is_extendable = __commonJS((exports, module) => {
  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */
  module.exports = function isExtendable(val) {
    return typeof val !== "undefined" && val !== null && (typeof val === "object" || typeof val === "function");
  };
});

// ../../node_modules/extend-shallow/index.js
var require_extend_shallow = __commonJS((exports, module) => {
  var isObject = require_is_extendable();
  module.exports = function extend(o) {
    if (!isObject(o)) {
      o = {};
    }
    var len = arguments.length;
    for (var i = 1;i < len; i++) {
      var obj = arguments[i];
      if (isObject(obj)) {
        assign(o, obj);
      }
    }
    return o;
  };
  function assign(a, b) {
    for (var key in b) {
      if (hasOwn(b, key)) {
        a[key] = b[key];
      }
    }
  }
  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }
});

// ../../node_modules/section-matter/index.js
var require_section_matter = __commonJS((exports, module) => {
  var typeOf = require_kind_of();
  var extend = require_extend_shallow();
  module.exports = function(input, options2) {
    if (typeof options2 === "function") {
      options2 = { parse: options2 };
    }
    var file = toObject(input);
    var defaults = { section_delimiter: "---", parse: identity };
    var opts = extend({}, defaults, options2);
    var delim = opts.section_delimiter;
    var lines = file.content.split(/\r?\n/);
    var sections = null;
    var section = createSection();
    var content = [];
    var stack = [];
    function initSections(val) {
      file.content = val;
      sections = [];
      content = [];
    }
    function closeSection(val) {
      if (stack.length) {
        section.key = getKey(stack[0], delim);
        section.content = val;
        opts.parse(section, sections);
        sections.push(section);
        section = createSection();
        content = [];
        stack = [];
      }
    }
    for (var i = 0;i < lines.length; i++) {
      var line = lines[i];
      var len = stack.length;
      var ln = line.trim();
      if (isDelimiter(ln, delim)) {
        if (ln.length === 3 && i !== 0) {
          if (len === 0 || len === 2) {
            content.push(line);
            continue;
          }
          stack.push(ln);
          section.data = content.join(`
`);
          content = [];
          continue;
        }
        if (sections === null) {
          initSections(content.join(`
`));
        }
        if (len === 2) {
          closeSection(content.join(`
`));
        }
        stack.push(ln);
        continue;
      }
      content.push(line);
    }
    if (sections === null) {
      initSections(content.join(`
`));
    } else {
      closeSection(content.join(`
`));
    }
    file.sections = sections;
    return file;
  };
  function isDelimiter(line, delim) {
    if (line.slice(0, delim.length) !== delim) {
      return false;
    }
    if (line.charAt(delim.length + 1) === delim.slice(-1)) {
      return false;
    }
    return true;
  }
  function toObject(input) {
    if (typeOf(input) !== "object") {
      input = { content: input };
    }
    if (typeof input.content !== "string" && !isBuffer(input.content)) {
      throw new TypeError("expected a buffer or string");
    }
    input.content = input.content.toString();
    input.sections = [];
    return input;
  }
  function getKey(val, delim) {
    return val ? val.slice(delim.length).trim() : "";
  }
  function createSection() {
    return { key: "", data: "", content: "" };
  }
  function identity(val) {
    return val;
  }
  function isBuffer(val) {
    if (val && val.constructor && typeof val.constructor.isBuffer === "function") {
      return val.constructor.isBuffer(val);
    }
    return false;
  }
});

// ../../node_modules/js-yaml/lib/js-yaml/common.js
var require_common = __commonJS((exports, module) => {
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence))
      return sequence;
    else if (isNothing(sequence))
      return [];
    return [sequence];
  }
  function extend(target, source) {
    var index, length, key, sourceKeys;
    if (source) {
      sourceKeys = Object.keys(source);
      for (index = 0, length = sourceKeys.length;index < length; index += 1) {
        key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    var result = "", cycle;
    for (cycle = 0;cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  exports.isNothing = isNothing;
  exports.isObject = isObject;
  exports.toArray = toArray;
  exports.repeat = repeat;
  exports.isNegativeZero = isNegativeZero;
  exports.extend = extend;
});

// ../../node_modules/js-yaml/lib/js-yaml/exception.js
var require_exception = __commonJS((exports, module) => {
  function YAMLException(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : "");
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException.prototype = Object.create(Error.prototype);
  YAMLException.prototype.constructor = YAMLException;
  YAMLException.prototype.toString = function toString(compact) {
    var result = this.name + ": ";
    result += this.reason || "(unknown reason)";
    if (!compact && this.mark) {
      result += " " + this.mark.toString();
    }
    return result;
  };
  module.exports = YAMLException;
});

// ../../node_modules/js-yaml/lib/js-yaml/mark.js
var require_mark = __commonJS((exports, module) => {
  var common = require_common();
  function Mark(name, buffer, position, line, column) {
    this.name = name;
    this.buffer = buffer;
    this.position = position;
    this.line = line;
    this.column = column;
  }
  Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
    var head, start, tail, end, snippet;
    if (!this.buffer)
      return null;
    indent = indent || 4;
    maxLength = maxLength || 75;
    head = "";
    start = this.position;
    while (start > 0 && `\x00\r
\x85\u2028\u2029`.indexOf(this.buffer.charAt(start - 1)) === -1) {
      start -= 1;
      if (this.position - start > maxLength / 2 - 1) {
        head = " ... ";
        start += 5;
        break;
      }
    }
    tail = "";
    end = this.position;
    while (end < this.buffer.length && `\x00\r
\x85\u2028\u2029`.indexOf(this.buffer.charAt(end)) === -1) {
      end += 1;
      if (end - this.position > maxLength / 2 - 1) {
        tail = " ... ";
        end -= 5;
        break;
      }
    }
    snippet = this.buffer.slice(start, end);
    return common.repeat(" ", indent) + head + snippet + tail + `
` + common.repeat(" ", indent + this.position - start + head.length) + "^";
  };
  Mark.prototype.toString = function toString(compact) {
    var snippet, where = "";
    if (this.name) {
      where += 'in "' + this.name + '" ';
    }
    where += "at line " + (this.line + 1) + ", column " + (this.column + 1);
    if (!compact) {
      snippet = this.getSnippet();
      if (snippet) {
        where += `:
` + snippet;
      }
    }
    return where;
  };
  module.exports = Mark;
});

// ../../node_modules/js-yaml/lib/js-yaml/type.js
var require_type = __commonJS((exports, module) => {
  var YAMLException = require_exception();
  var TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "defaultStyle",
    "styleAliases"
  ];
  var YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map) {
    var result = {};
    if (map !== null) {
      Object.keys(map).forEach(function(style) {
        map[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type(tag, options2) {
    options2 = options2 || {};
    Object.keys(options2).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.tag = tag;
    this.kind = options2["kind"] || null;
    this.resolve = options2["resolve"] || function() {
      return true;
    };
    this.construct = options2["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options2["instanceOf"] || null;
    this.predicate = options2["predicate"] || null;
    this.represent = options2["represent"] || null;
    this.defaultStyle = options2["defaultStyle"] || null;
    this.styleAliases = compileStyleAliases(options2["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  module.exports = Type;
});

// ../../node_modules/js-yaml/lib/js-yaml/schema.js
var require_schema = __commonJS((exports, module) => {
  var common = require_common();
  var YAMLException = require_exception();
  var Type = require_type();
  function compileList(schema, name, result) {
    var exclude = [];
    schema.include.forEach(function(includedSchema) {
      result = compileList(includedSchema, name, result);
    });
    schema[name].forEach(function(currentType) {
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
          exclude.push(previousIndex);
        }
      });
      result.push(currentType);
    });
    return result.filter(function(type, index) {
      return exclude.indexOf(index) === -1;
    });
  }
  function compileMap() {
    var result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {}
    }, index, length;
    function collectType(type) {
      result[type.kind][type.tag] = result["fallback"][type.tag] = type;
    }
    for (index = 0, length = arguments.length;index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema(definition) {
    this.include = definition.include || [];
    this.implicit = definition.implicit || [];
    this.explicit = definition.explicit || [];
    this.implicit.forEach(function(type) {
      if (type.loadKind && type.loadKind !== "scalar") {
        throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
    });
    this.compiledImplicit = compileList(this, "implicit", []);
    this.compiledExplicit = compileList(this, "explicit", []);
    this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
  }
  Schema.DEFAULT = null;
  Schema.create = function createSchema() {
    var schemas, types;
    switch (arguments.length) {
      case 1:
        schemas = Schema.DEFAULT;
        types = arguments[0];
        break;
      case 2:
        schemas = arguments[0];
        types = arguments[1];
        break;
      default:
        throw new YAMLException("Wrong number of arguments for Schema.create function");
    }
    schemas = common.toArray(schemas);
    types = common.toArray(types);
    if (!schemas.every(function(schema) {
      return schema instanceof Schema;
    })) {
      throw new YAMLException("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
    }
    if (!types.every(function(type) {
      return type instanceof Type;
    })) {
      throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    return new Schema({
      include: schemas,
      explicit: types
    });
  };
  module.exports = Schema;
});

// ../../node_modules/js-yaml/lib/js-yaml/type/str.js
var require_str = __commonJS((exports, module) => {
  var Type = require_type();
  module.exports = new Type("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/seq.js
var require_seq = __commonJS((exports, module) => {
  var Type = require_type();
  module.exports = new Type("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/map.js
var require_map = __commonJS((exports, module) => {
  var Type = require_type();
  module.exports = new Type("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/schema/failsafe.js
var require_failsafe = __commonJS((exports, module) => {
  var Schema = require_schema();
  module.exports = new Schema({
    explicit: [
      require_str(),
      require_seq(),
      require_map()
    ]
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/null.js
var require_null = __commonJS((exports, module) => {
  var Type = require_type();
  function resolveYamlNull(data) {
    if (data === null)
      return true;
    var max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  module.exports = new Type("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      }
    },
    defaultStyle: "lowercase"
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/bool.js
var require_bool = __commonJS((exports, module) => {
  var Type = require_type();
  function resolveYamlBoolean(data) {
    if (data === null)
      return false;
    var max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  module.exports = new Type("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/int.js
var require_int = __commonJS((exports, module) => {
  var common = require_common();
  var Type = require_type();
  function isHexCode(c) {
    return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
  }
  function isOctCode(c) {
    return 48 <= c && c <= 55;
  }
  function isDecCode(c) {
    return 48 <= c && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null)
      return false;
    var max = data.length, index = 0, hasDigits = false, ch;
    if (!max)
      return false;
    ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max)
        return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (;index < max; index++) {
          ch = data[index];
          if (ch === "_")
            continue;
          if (ch !== "0" && ch !== "1")
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "x") {
        index++;
        for (;index < max; index++) {
          ch = data[index];
          if (ch === "_")
            continue;
          if (!isHexCode(data.charCodeAt(index)))
            return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      for (;index < max; index++) {
        ch = data[index];
        if (ch === "_")
          continue;
        if (!isOctCode(data.charCodeAt(index)))
          return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "_")
      return false;
    for (;index < max; index++) {
      ch = data[index];
      if (ch === "_")
        continue;
      if (ch === ":")
        break;
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits || ch === "_")
      return false;
    if (ch !== ":")
      return true;
    return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
  }
  function constructYamlInteger(data) {
    var value = data, sign = 1, ch, base, digits = [];
    if (value.indexOf("_") !== -1) {
      value = value.replace(/_/g, "");
    }
    ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-")
        sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0")
      return 0;
    if (ch === "0") {
      if (value[1] === "b")
        return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x")
        return sign * parseInt(value, 16);
      return sign * parseInt(value, 8);
    }
    if (value.indexOf(":") !== -1) {
      value.split(":").forEach(function(v) {
        digits.unshift(parseInt(v, 10));
      });
      value = 0;
      base = 1;
      digits.forEach(function(d) {
        value += d * base;
        base *= 60;
      });
      return sign * value;
    }
    return sign * parseInt(value, 10);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
  }
  module.exports = new Type("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0" + obj.toString(8) : "-0" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/float.js
var require_float = __commonJS((exports, module) => {
  var common = require_common();
  var Type = require_type();
  var YAML_FLOAT_PATTERN = new RegExp("^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?" + "|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?" + "|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*" + "|[-+]?\\.(?:inf|Inf|INF)" + "|\\.(?:nan|NaN|NAN))$");
  function resolveYamlFloat(data) {
    if (data === null)
      return false;
    if (!YAML_FLOAT_PATTERN.test(data) || data[data.length - 1] === "_") {
      return false;
    }
    return true;
  }
  function constructYamlFloat(data) {
    var value, sign, base, digits;
    value = data.replace(/_/g, "").toLowerCase();
    sign = value[0] === "-" ? -1 : 1;
    digits = [];
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    } else if (value.indexOf(":") >= 0) {
      value.split(":").forEach(function(v) {
        digits.unshift(parseFloat(v, 10));
      });
      value = 0;
      base = 1;
      digits.forEach(function(d) {
        value += d * base;
        base *= 60;
      });
      return sign * value;
    }
    return sign * parseFloat(value, 10);
  }
  var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    var res;
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common.isNegativeZero(object)) {
      return "-0.0";
    }
    res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
  }
  module.exports = new Type("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/schema/json.js
var require_json = __commonJS((exports, module) => {
  var Schema = require_schema();
  module.exports = new Schema({
    include: [
      require_failsafe()
    ],
    implicit: [
      require_null(),
      require_bool(),
      require_int(),
      require_float()
    ]
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/schema/core.js
var require_core = __commonJS((exports, module) => {
  var Schema = require_schema();
  module.exports = new Schema({
    include: [
      require_json()
    ]
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/timestamp.js
var require_timestamp = __commonJS((exports, module) => {
  var Type = require_type();
  var YAML_DATE_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9])" + "-([0-9][0-9])$");
  var YAML_TIMESTAMP_REGEXP = new RegExp("^([0-9][0-9][0-9][0-9])" + "-([0-9][0-9]?)" + "-([0-9][0-9]?)" + "(?:[Tt]|[ \\t]+)" + "([0-9][0-9]?)" + ":([0-9][0-9])" + ":([0-9][0-9])" + "(?:\\.([0-9]*))?" + "(?:[ \\t]*(Z|([-+])([0-9][0-9]?)" + "(?::([0-9][0-9]))?))?$");
  function resolveYamlTimestamp(data) {
    if (data === null)
      return false;
    if (YAML_DATE_REGEXP.exec(data) !== null)
      return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null)
      return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
    match = YAML_DATE_REGEXP.exec(data);
    if (match === null)
      match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null)
      throw new Error("Date resolve error");
    year = +match[1];
    month = +match[2] - 1;
    day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    hour = +match[4];
    minute = +match[5];
    second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      tz_hour = +match[10];
      tz_minute = +(match[11] || 0);
      delta = (tz_hour * 60 + tz_minute) * 60000;
      if (match[9] === "-")
        delta = -delta;
    }
    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta)
      date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  module.exports = new Type("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/merge.js
var require_merge = __commonJS((exports, module) => {
  var Type = require_type();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  module.exports = new Type("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/binary.js
var require_binary = __commonJS((exports, module) => {
  var NodeBuffer;
  try {
    _require = __require;
    NodeBuffer = _require("buffer").Buffer;
  } catch (__) {}
  var _require;
  var Type = require_type();
  var BASE64_MAP = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function resolveYamlBinary(data) {
    if (data === null)
      return false;
    var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
    for (idx = 0;idx < max; idx++) {
      code = map.indexOf(data.charAt(idx));
      if (code > 64)
        continue;
      if (code < 0)
        return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
    for (idx = 0;idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map.indexOf(input.charAt(idx));
    }
    tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    if (NodeBuffer) {
      return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
    }
    return result;
  }
  function representYamlBinary(object) {
    var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
    for (idx = 0;idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    tail = max % 3;
    if (tail === 0) {
      result += map[bits >> 18 & 63];
      result += map[bits >> 12 & 63];
      result += map[bits >> 6 & 63];
      result += map[bits & 63];
    } else if (tail === 2) {
      result += map[bits >> 10 & 63];
      result += map[bits >> 4 & 63];
      result += map[bits << 2 & 63];
      result += map[64];
    } else if (tail === 1) {
      result += map[bits >> 2 & 63];
      result += map[bits << 4 & 63];
      result += map[64];
      result += map[64];
    }
    return result;
  }
  function isBinary(object) {
    return NodeBuffer && NodeBuffer.isBuffer(object);
  }
  module.exports = new Type("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/omap.js
var require_omap = __commonJS((exports, module) => {
  var Type = require_type();
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null)
      return true;
    var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
    for (index = 0, length = object.length;index < length; index += 1) {
      pair = object[index];
      pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]")
        return false;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey)
            pairHasKey = true;
          else
            return false;
        }
      }
      if (!pairHasKey)
        return false;
      if (objectKeys.indexOf(pairKey) === -1)
        objectKeys.push(pairKey);
      else
        return false;
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  module.exports = new Type("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/pairs.js
var require_pairs = __commonJS((exports, module) => {
  var Type = require_type();
  var _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null)
      return true;
    var index, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index = 0, length = object.length;index < length; index += 1) {
      pair = object[index];
      if (_toString.call(pair) !== "[object Object]")
        return false;
      keys = Object.keys(pair);
      if (keys.length !== 1)
        return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null)
      return [];
    var index, length, pair, keys, result, object = data;
    result = new Array(object.length);
    for (index = 0, length = object.length;index < length; index += 1) {
      pair = object[index];
      keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  module.exports = new Type("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/set.js
var require_set = __commonJS((exports, module) => {
  var Type = require_type();
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null)
      return true;
    var key, object = data;
    for (key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null)
          return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  module.exports = new Type("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/schema/default_safe.js
var require_default_safe = __commonJS((exports, module) => {
  var Schema = require_schema();
  module.exports = new Schema({
    include: [
      require_core()
    ],
    implicit: [
      require_timestamp(),
      require_merge()
    ],
    explicit: [
      require_binary(),
      require_omap(),
      require_pairs(),
      require_set()
    ]
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/js/undefined.js
var require_undefined = __commonJS((exports, module) => {
  var Type = require_type();
  function resolveJavascriptUndefined() {
    return true;
  }
  function constructJavascriptUndefined() {
    return;
  }
  function representJavascriptUndefined() {
    return "";
  }
  function isUndefined(object) {
    return typeof object === "undefined";
  }
  module.exports = new Type("tag:yaml.org,2002:js/undefined", {
    kind: "scalar",
    resolve: resolveJavascriptUndefined,
    construct: constructJavascriptUndefined,
    predicate: isUndefined,
    represent: representJavascriptUndefined
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/js/regexp.js
var require_regexp = __commonJS((exports, module) => {
  var Type = require_type();
  function resolveJavascriptRegExp(data) {
    if (data === null)
      return false;
    if (data.length === 0)
      return false;
    var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
    if (regexp[0] === "/") {
      if (tail)
        modifiers = tail[1];
      if (modifiers.length > 3)
        return false;
      if (regexp[regexp.length - modifiers.length - 1] !== "/")
        return false;
    }
    return true;
  }
  function constructJavascriptRegExp(data) {
    var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
    if (regexp[0] === "/") {
      if (tail)
        modifiers = tail[1];
      regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
    }
    return new RegExp(regexp, modifiers);
  }
  function representJavascriptRegExp(object) {
    var result = "/" + object.source + "/";
    if (object.global)
      result += "g";
    if (object.multiline)
      result += "m";
    if (object.ignoreCase)
      result += "i";
    return result;
  }
  function isRegExp(object) {
    return Object.prototype.toString.call(object) === "[object RegExp]";
  }
  module.exports = new Type("tag:yaml.org,2002:js/regexp", {
    kind: "scalar",
    resolve: resolveJavascriptRegExp,
    construct: constructJavascriptRegExp,
    predicate: isRegExp,
    represent: representJavascriptRegExp
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/type/js/function.js
var require_function = __commonJS((exports, module) => {
  var esprima;
  try {
    _require = __require;
    esprima = _require("esprima");
  } catch (_) {
    if (typeof window !== "undefined")
      esprima = window.esprima;
  }
  var _require;
  var Type = require_type();
  function resolveJavascriptFunction(data) {
    if (data === null)
      return false;
    try {
      var source = "(" + data + ")", ast = esprima.parse(source, { range: true });
      if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
        return false;
      }
      return true;
    } catch (err) {
      return false;
    }
  }
  function constructJavascriptFunction(data) {
    var source = "(" + data + ")", ast = esprima.parse(source, { range: true }), params = [], body;
    if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
      throw new Error("Failed to resolve function");
    }
    ast.body[0].expression.params.forEach(function(param) {
      params.push(param.name);
    });
    body = ast.body[0].expression.body.range;
    if (ast.body[0].expression.body.type === "BlockStatement") {
      return new Function(params, source.slice(body[0] + 1, body[1] - 1));
    }
    return new Function(params, "return " + source.slice(body[0], body[1]));
  }
  function representJavascriptFunction(object) {
    return object.toString();
  }
  function isFunction(object) {
    return Object.prototype.toString.call(object) === "[object Function]";
  }
  module.exports = new Type("tag:yaml.org,2002:js/function", {
    kind: "scalar",
    resolve: resolveJavascriptFunction,
    construct: constructJavascriptFunction,
    predicate: isFunction,
    represent: representJavascriptFunction
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/schema/default_full.js
var require_default_full = __commonJS((exports, module) => {
  var Schema = require_schema();
  module.exports = Schema.DEFAULT = new Schema({
    include: [
      require_default_safe()
    ],
    explicit: [
      require_undefined(),
      require_regexp(),
      require_function()
    ]
  });
});

// ../../node_modules/js-yaml/lib/js-yaml/loader.js
var require_loader = __commonJS((exports, module) => {
  var common = require_common();
  var YAMLException = require_exception();
  var Mark = require_mark();
  var DEFAULT_SAFE_SCHEMA = require_default_safe();
  var DEFAULT_FULL_SCHEMA = require_default_full();
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var CONTEXT_FLOW_IN = 1;
  var CONTEXT_FLOW_OUT = 2;
  var CONTEXT_BLOCK_IN = 3;
  var CONTEXT_BLOCK_OUT = 4;
  var CHOMPING_CLIP = 1;
  var CHOMPING_STRIP = 2;
  var CHOMPING_KEEP = 3;
  var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
  var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
  var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function is_EOL(c) {
    return c === 10 || c === 13;
  }
  function is_WHITE_SPACE(c) {
    return c === 9 || c === 32;
  }
  function is_WS_OR_EOL(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function is_FLOW_INDICATOR(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    var lc;
    if (48 <= c && c <= 57) {
      return c - 48;
    }
    lc = c | 32;
    if (97 <= lc && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (48 <= c && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    return c === 48 ? "\x00" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "\t" : c === 9 ? "\t" : c === 110 ? `
` : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  var simpleEscapeCheck = new Array(256);
  var simpleEscapeMap = new Array(256);
  for (i = 0;i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  var i;
  function State(input, options2) {
    this.input = input;
    this.filename = options2["filename"] || null;
    this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
    this.onWarning = options2["onWarning"] || null;
    this.legacy = options2["legacy"] || false;
    this.json = options2["json"] || false;
    this.listener = options2["listener"] || null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.documents = [];
  }
  function generateError(state, message) {
    return new YAMLException(message, new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  var directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      var match, major, minor;
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      major = parseInt(match[1], 10);
      minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      var handle, prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    var _position, _length, _character, _result;
    if (start < end) {
      _result = state.input.slice(start, end);
      if (checkJson) {
        for (_position = 0, _length = _result.length;_position < _length; _position += 1) {
          _character = _result.charCodeAt(_position);
          if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    var sourceKeys, key, index, quantity;
    if (!common.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    sourceKeys = Object.keys(source);
    for (index = 0, quantity = sourceKeys.length;index < quantity; index += 1) {
      key = sourceKeys[index];
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
    var index, quantity;
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (index = 0, quantity = keyNode.length;index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        for (index = 0, quantity = valueNode.length;index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    var ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (is_EOL(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    var _position = state.position, ch;
    ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || is_WS_OR_EOL(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common.repeat(`
`, count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
    ch = state.input.charCodeAt(state.position);
    if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          break;
        }
      } else if (ch === 35) {
        preceding = state.input.charCodeAt(state.position - 1);
        if (is_WS_OR_EOL(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
        break;
      } else if (is_EOL(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!is_WHITE_SPACE(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    var ch, captureStart, captureEnd;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (is_EOL(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          hexLength = tmp;
          hexResult = 0;
          for (;hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (is_EOL(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        captureEnd = state.position;
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    var readNext = true, _line, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = {}, keyNode, keyTag, valueNode, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (is_WHITE_SPACE(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (is_WHITE_SPACE(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!is_EOL(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (is_EOL(ch)) {
        emptyLines++;
        continue;
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += `
`;
          }
        }
        break;
      }
      if (folding) {
        if (is_WHITE_SPACE(ch)) {
          atMoreIndented = true;
          state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common.repeat(`
`, emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common.repeat(`
`, emptyLines);
        }
      } else {
        state.result += common.repeat(`
`, didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      captureStart = state.position;
      while (!is_EOL(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (ch !== 45) {
        break;
      }
      following = state.input.charCodeAt(state.position + 1);
      if (!is_WS_OR_EOL(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    var following, allowCompact, _line, _pos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = {}, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = _result;
    }
    ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      following = state.input.charCodeAt(state.position + 1);
      _line = state.line;
      _pos = state.position;
      if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!is_WS_OR_EOL(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else {
        break;
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if (state.lineIndent > nodeIndent && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 33)
      return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    var _position, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 38)
      return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    var _position, alias, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 42)
      return false;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, type, flowIndent, blockIndent;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (readTagProperty(state) || readAnchorProperty(state)) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag !== null && state.tag !== "!") {
      if (state.tag === "?") {
        if (state.result !== null && state.kind !== "scalar") {
          throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
        }
        for (typeIndex = 0, typeQuantity = state.implicitTypes.length;typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];
          if (type.resolve(state.result)) {
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
            break;
          }
        }
      } else if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type = state.typeMap[state.kind || "fallback"][state.tag];
        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }
        if (!type.resolve(state.result)) {
          throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
        } else {
          state.result = type.construct(state.result);
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      } else {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = {};
    state.anchorMap = {};
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveName = state.input.slice(_position, state.position);
      directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !is_EOL(ch));
          break;
        }
        if (is_EOL(ch))
          break;
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0)
        readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    } else {
      return;
    }
  }
  function loadDocuments(input, options2) {
    input = String(input);
    options2 = options2 || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += `
`;
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    var state = new State(input, options2);
    var nullpos = input.indexOf("\x00");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\x00";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll(input, iterator, options2) {
    if (iterator !== null && typeof iterator === "object" && typeof options2 === "undefined") {
      options2 = iterator;
      iterator = null;
    }
    var documents = loadDocuments(input, options2);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (var index = 0, length = documents.length;index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load(input, options2) {
    var documents = loadDocuments(input, options2);
    if (documents.length === 0) {
      return;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException("expected a single document in the stream, but found more");
  }
  function safeLoadAll(input, iterator, options2) {
    if (typeof iterator === "object" && iterator !== null && typeof options2 === "undefined") {
      options2 = iterator;
      iterator = null;
    }
    return loadAll(input, iterator, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
  }
  function safeLoad(input, options2) {
    return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
  }
  exports.loadAll = loadAll;
  exports.load = load;
  exports.safeLoadAll = safeLoadAll;
  exports.safeLoad = safeLoad;
});

// ../../node_modules/js-yaml/lib/js-yaml/dumper.js
var require_dumper = __commonJS((exports, module) => {
  var common = require_common();
  var YAMLException = require_exception();
  var DEFAULT_FULL_SCHEMA = require_default_full();
  var DEFAULT_SAFE_SCHEMA = require_default_safe();
  var _toString = Object.prototype.toString;
  var _hasOwnProperty = Object.prototype.hasOwnProperty;
  var CHAR_TAB = 9;
  var CHAR_LINE_FEED = 10;
  var CHAR_CARRIAGE_RETURN = 13;
  var CHAR_SPACE = 32;
  var CHAR_EXCLAMATION = 33;
  var CHAR_DOUBLE_QUOTE = 34;
  var CHAR_SHARP = 35;
  var CHAR_PERCENT = 37;
  var CHAR_AMPERSAND = 38;
  var CHAR_SINGLE_QUOTE = 39;
  var CHAR_ASTERISK = 42;
  var CHAR_COMMA = 44;
  var CHAR_MINUS = 45;
  var CHAR_COLON = 58;
  var CHAR_EQUALS = 61;
  var CHAR_GREATER_THAN = 62;
  var CHAR_QUESTION = 63;
  var CHAR_COMMERCIAL_AT = 64;
  var CHAR_LEFT_SQUARE_BRACKET = 91;
  var CHAR_RIGHT_SQUARE_BRACKET = 93;
  var CHAR_GRAVE_ACCENT = 96;
  var CHAR_LEFT_CURLY_BRACKET = 123;
  var CHAR_VERTICAL_LINE = 124;
  var CHAR_RIGHT_CURLY_BRACKET = 125;
  var ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = "\\\"";
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  var DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  function compileStyleMap(schema, map) {
    var result, keys, index, length, tag, style, type;
    if (map === null)
      return {};
    result = {};
    keys = Object.keys(map);
    for (index = 0, length = keys.length;index < length; index += 1) {
      tag = keys[index];
      style = String(map[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      type = schema.compiledTypeMap["fallback"][tag];
      if (type && _hasOwnProperty.call(type.styleAliases, style)) {
        style = type.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    var string, handle, length;
    string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common.repeat("0", length - string.length) + string;
  }
  function State(options2) {
    this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
    this.indent = Math.max(1, options2["indent"] || 2);
    this.noArrayIndent = options2["noArrayIndent"] || false;
    this.skipInvalid = options2["skipInvalid"] || false;
    this.flowLevel = common.isNothing(options2["flowLevel"]) ? -1 : options2["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options2["styles"] || null);
    this.sortKeys = options2["sortKeys"] || false;
    this.lineWidth = options2["lineWidth"] || 80;
    this.noRefs = options2["noRefs"] || false;
    this.noCompatMode = options2["noCompatMode"] || false;
    this.condenseFlow = options2["condenseFlow"] || false;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
    while (position < length) {
      next = string.indexOf(`
`, position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== `
`)
        result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return `
` + common.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    var index, length, type;
    for (index = 0, length = state.implicitTypes.length;index < length; index += 1) {
      type = state.implicitTypes[index];
      if (type.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
  }
  function isNsChar(c) {
    return isPrintable(c) && !isWhitespace(c) && c !== 65279 && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev) {
    return isPrintable(c) && c !== 65279 && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function needIndentIndicator(string) {
    var leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  var STYLE_PLAIN = 1;
  var STYLE_SINGLE = 2;
  var STYLE_LITERAL = 3;
  var STYLE_FOLDED = 4;
  var STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
    var i;
    var char, prev_char;
    var hasLineBreak = false;
    var hasFoldableLine = false;
    var shouldTrackWidth = lineWidth !== -1;
    var previousLineBreak = -1;
    var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
    if (singleLineOnly) {
      for (i = 0;i < string.length; i++) {
        char = string.charCodeAt(i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
        plain = plain && isPlainSafe(char, prev_char);
      }
    } else {
      for (i = 0;i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
        plain = plain && isPlainSafe(char, prev_char);
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  function writeScalar(state, string, level, iskey) {
    state.dump = function() {
      if (string.length === 0) {
        return "''";
      }
      if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
        return "'" + string + "'";
      }
      var indent = state.indent * Math.max(1, level);
      var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string, lineWidth) + '"';
        default:
          throw new YAMLException("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    var clip = string[string.length - 1] === `
`;
    var keep = clip && (string[string.length - 2] === `
` || string === `
`);
    var chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + `
`;
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === `
` ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    var lineRe = /(\n+)([^\n]*)/g;
    var result = function() {
      var nextLF = string.indexOf(`
`);
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    var prevMoreIndented = string[0] === `
` || string[0] === " ";
    var moreIndented;
    var match;
    while (match = lineRe.exec(string)) {
      var prefix = match[1], line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? `
` : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ")
      return line;
    var breakRe = / [^ ]/g;
    var match;
    var start = 0, end, curr = 0, next = 0;
    var result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += `
` + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += `
`;
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + `
` + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    var result = "";
    var char, nextChar;
    var escapeSeq;
    for (var i = 0;i < string.length; i++) {
      char = string.charCodeAt(i);
      if (char >= 55296 && char <= 56319) {
        nextChar = string.charCodeAt(i + 1);
        if (nextChar >= 56320 && nextChar <= 57343) {
          result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
          i++;
          continue;
        }
      }
      escapeSeq = ESCAPE_SEQUENCES[char];
      result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    var _result = "", _tag = state.tag, index, length;
    for (index = 0, length = object.length;index < length; index += 1) {
      if (writeNode(state, level, object[index], false, false)) {
        if (index !== 0)
          _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    var _result = "", _tag = state.tag, index, length;
    for (index = 0, length = object.length;index < length; index += 1) {
      if (writeNode(state, level + 1, object[index], true, true)) {
        if (!compact || index !== 0) {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
    for (index = 0, length = objectKeyList.length;index < length; index += 1) {
      pairBuffer = "";
      if (index !== 0)
        pairBuffer += ", ";
      if (state.condenseFlow)
        pairBuffer += '"';
      objectKey = objectKeyList[index];
      objectValue = object[objectKey];
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024)
        pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException("sortKeys must be a boolean or a function");
    }
    for (index = 0, length = objectKeyList.length;index < length; index += 1) {
      pairBuffer = "";
      if (!compact || index !== 0) {
        pairBuffer += generateNextLine(state, level);
      }
      objectKey = objectKeyList[index];
      objectValue = object[objectKey];
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    var _result, typeList, index, length, type, style;
    typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (index = 0, length = typeList.length;index < length; index += 1) {
      type = typeList[index];
      if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
        state.tag = explicit ? type.tag : "?";
        if (type.represent) {
          style = state.styleMap[type.tag] || type.defaultStyle;
          if (_toString.call(type.represent) === "[object Function]") {
            _result = type.represent(object, style);
          } else if (_hasOwnProperty.call(type.represent, style)) {
            _result = type.represent[style](object, style);
          } else {
            throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    var type = _toString.call(state.dump);
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type === "[object Array]") {
        var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
        if (block && state.dump.length !== 0) {
          writeBlockSequence(state, arrayLevel, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, arrayLevel, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey);
        }
      } else {
        if (state.skipInvalid)
          return false;
        throw new YAMLException("unacceptable kind of an object to dump " + type);
      }
      if (state.tag !== null && state.tag !== "?") {
        state.dump = "!<" + state.tag + "> " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    var objects = [], duplicatesIndexes = [], index, length;
    inspectNode(object, objects, duplicatesIndexes);
    for (index = 0, length = duplicatesIndexes.length;index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    var objectKeyList, index, length;
    if (object !== null && typeof object === "object") {
      index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (index = 0, length = object.length;index < length; index += 1) {
            inspectNode(object[index], objects, duplicatesIndexes);
          }
        } else {
          objectKeyList = Object.keys(object);
          for (index = 0, length = objectKeyList.length;index < length; index += 1) {
            inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump(input, options2) {
    options2 = options2 || {};
    var state = new State(options2);
    if (!state.noRefs)
      getDuplicateReferences(input, state);
    if (writeNode(state, 0, input, true, true))
      return state.dump + `
`;
    return "";
  }
  function safeDump(input, options2) {
    return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
  }
  exports.dump = dump;
  exports.safeDump = safeDump;
});

// ../../node_modules/js-yaml/lib/js-yaml.js
var require_js_yaml = __commonJS((exports, module) => {
  var loader = require_loader();
  var dumper = require_dumper();
  function deprecated(name) {
    return function() {
      throw new Error("Function " + name + " is deprecated and cannot be used.");
    };
  }
  exports.Type = require_type();
  exports.Schema = require_schema();
  exports.FAILSAFE_SCHEMA = require_failsafe();
  exports.JSON_SCHEMA = require_json();
  exports.CORE_SCHEMA = require_core();
  exports.DEFAULT_SAFE_SCHEMA = require_default_safe();
  exports.DEFAULT_FULL_SCHEMA = require_default_full();
  exports.load = loader.load;
  exports.loadAll = loader.loadAll;
  exports.safeLoad = loader.safeLoad;
  exports.safeLoadAll = loader.safeLoadAll;
  exports.dump = dumper.dump;
  exports.safeDump = dumper.safeDump;
  exports.YAMLException = require_exception();
  exports.MINIMAL_SCHEMA = require_failsafe();
  exports.SAFE_SCHEMA = require_default_safe();
  exports.DEFAULT_SCHEMA = require_default_full();
  exports.scan = deprecated("scan");
  exports.parse = deprecated("parse");
  exports.compose = deprecated("compose");
  exports.addConstructor = deprecated("addConstructor");
});

// ../../node_modules/js-yaml/index.js
var require_js_yaml2 = __commonJS((exports, module) => {
  var yaml = require_js_yaml();
  module.exports = yaml;
});

// ../../node_modules/gray-matter/lib/engines.js
var require_engines = __commonJS((exports, module) => {
  var yaml = require_js_yaml2();
  var engines = exports = module.exports;
  engines.yaml = {
    parse: yaml.safeLoad.bind(yaml),
    stringify: yaml.safeDump.bind(yaml)
  };
  engines.json = {
    parse: JSON.parse.bind(JSON),
    stringify: function(obj, options2) {
      const opts = Object.assign({ replacer: null, space: 2 }, options2);
      return JSON.stringify(obj, opts.replacer, opts.space);
    }
  };
  engines.javascript = {
    parse: function parse(str, options, wrap) {
      try {
        if (wrap !== false) {
          str = `(function() {
return ` + str.trim() + `;
}());`;
        }
        return eval(str) || {};
      } catch (err) {
        if (wrap !== false && /(unexpected|identifier)/i.test(err.message)) {
          return parse(str, options, false);
        }
        throw new SyntaxError(err);
      }
    },
    stringify: function() {
      throw new Error("stringifying JavaScript is not supported");
    }
  };
});

// ../../node_modules/strip-bom-string/index.js
var require_strip_bom_string = __commonJS((exports, module) => {
  /*!
   * strip-bom-string <https://github.com/jonschlinkert/strip-bom-string>
   *
   * Copyright (c) 2015, 2017, Jon Schlinkert.
   * Released under the MIT License.
   */
  module.exports = function(str2) {
    if (typeof str2 === "string" && str2.charAt(0) === "\uFEFF") {
      return str2.slice(1);
    }
    return str2;
  };
});

// ../../node_modules/gray-matter/lib/utils.js
var require_utils = __commonJS((exports) => {
  var stripBom = require_strip_bom_string();
  var typeOf = require_kind_of();
  exports.define = function(obj, key, val) {
    Reflect.defineProperty(obj, key, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: val
    });
  };
  exports.isBuffer = function(val) {
    return typeOf(val) === "buffer";
  };
  exports.isObject = function(val) {
    return typeOf(val) === "object";
  };
  exports.toBuffer = function(input) {
    return typeof input === "string" ? Buffer.from(input) : input;
  };
  exports.toString = function(input) {
    if (exports.isBuffer(input))
      return stripBom(String(input));
    if (typeof input !== "string") {
      throw new TypeError("expected input to be a string or buffer");
    }
    return stripBom(input);
  };
  exports.arrayify = function(val) {
    return val ? Array.isArray(val) ? val : [val] : [];
  };
  exports.startsWith = function(str2, substr, len) {
    if (typeof len !== "number")
      len = substr.length;
    return str2.slice(0, len) === substr;
  };
});

// ../../node_modules/gray-matter/lib/defaults.js
var require_defaults = __commonJS((exports, module) => {
  var engines = require_engines();
  var utils = require_utils();
  module.exports = function(options2) {
    const opts = Object.assign({}, options2);
    opts.delimiters = utils.arrayify(opts.delims || opts.delimiters || "---");
    if (opts.delimiters.length === 1) {
      opts.delimiters.push(opts.delimiters[0]);
    }
    opts.language = (opts.language || opts.lang || "yaml").toLowerCase();
    opts.engines = Object.assign({}, engines, opts.parsers, opts.engines);
    return opts;
  };
});

// ../../node_modules/gray-matter/lib/engine.js
var require_engine = __commonJS((exports, module) => {
  module.exports = function(name, options2) {
    let engine = options2.engines[name] || options2.engines[aliase(name)];
    if (typeof engine === "undefined") {
      throw new Error('gray-matter engine "' + name + '" is not registered');
    }
    if (typeof engine === "function") {
      engine = { parse: engine };
    }
    return engine;
  };
  function aliase(name) {
    switch (name.toLowerCase()) {
      case "js":
      case "javascript":
        return "javascript";
      case "coffee":
      case "coffeescript":
      case "cson":
        return "coffee";
      case "yaml":
      case "yml":
        return "yaml";
      default: {
        return name;
      }
    }
  }
});

// ../../node_modules/gray-matter/lib/stringify.js
var require_stringify = __commonJS((exports, module) => {
  var typeOf = require_kind_of();
  var getEngine = require_engine();
  var defaults = require_defaults();
  module.exports = function(file, data, options2) {
    if (data == null && options2 == null) {
      switch (typeOf(file)) {
        case "object":
          data = file.data;
          options2 = {};
          break;
        case "string":
          return file;
        default: {
          throw new TypeError("expected file to be a string or object");
        }
      }
    }
    const str2 = file.content;
    const opts = defaults(options2);
    if (data == null) {
      if (!opts.data)
        return file;
      data = opts.data;
    }
    const language = file.language || opts.language;
    const engine = getEngine(language, opts);
    if (typeof engine.stringify !== "function") {
      throw new TypeError('expected "' + language + '.stringify" to be a function');
    }
    data = Object.assign({}, file.data, data);
    const open = opts.delimiters[0];
    const close = opts.delimiters[1];
    const matter = engine.stringify(data, options2).trim();
    let buf = "";
    if (matter !== "{}") {
      buf = newline(open) + newline(matter) + newline(close);
    }
    if (typeof file.excerpt === "string" && file.excerpt !== "") {
      if (str2.indexOf(file.excerpt.trim()) === -1) {
        buf += newline(file.excerpt) + newline(close);
      }
    }
    return buf + newline(str2);
  };
  function newline(str2) {
    return str2.slice(-1) !== `
` ? str2 + `
` : str2;
  }
});

// ../../node_modules/gray-matter/lib/excerpt.js
var require_excerpt = __commonJS((exports, module) => {
  var defaults = require_defaults();
  module.exports = function(file, options2) {
    const opts = defaults(options2);
    if (file.data == null) {
      file.data = {};
    }
    if (typeof opts.excerpt === "function") {
      return opts.excerpt(file, opts);
    }
    const sep = file.data.excerpt_separator || opts.excerpt_separator;
    if (sep == null && (opts.excerpt === false || opts.excerpt == null)) {
      return file;
    }
    const delimiter = typeof opts.excerpt === "string" ? opts.excerpt : sep || opts.delimiters[0];
    const idx = file.content.indexOf(delimiter);
    if (idx !== -1) {
      file.excerpt = file.content.slice(0, idx);
    }
    return file;
  };
});

// ../../node_modules/gray-matter/lib/to-file.js
var require_to_file = __commonJS((exports, module) => {
  var typeOf = require_kind_of();
  var stringify = require_stringify();
  var utils = require_utils();
  module.exports = function(file) {
    if (typeOf(file) !== "object") {
      file = { content: file };
    }
    if (typeOf(file.data) !== "object") {
      file.data = {};
    }
    if (file.contents && file.content == null) {
      file.content = file.contents;
    }
    utils.define(file, "orig", utils.toBuffer(file.content));
    utils.define(file, "language", file.language || "");
    utils.define(file, "matter", file.matter || "");
    utils.define(file, "stringify", function(data, options2) {
      if (options2 && options2.language) {
        file.language = options2.language;
      }
      return stringify(file, data, options2);
    });
    file.content = utils.toString(file.content);
    file.isEmpty = false;
    file.excerpt = "";
    return file;
  };
});

// ../../node_modules/gray-matter/lib/parse.js
var require_parse = __commonJS((exports, module) => {
  var getEngine = require_engine();
  var defaults = require_defaults();
  module.exports = function(language, str2, options2) {
    const opts = defaults(options2);
    const engine = getEngine(language, opts);
    if (typeof engine.parse !== "function") {
      throw new TypeError('expected "' + language + '.parse" to be a function');
    }
    return engine.parse(str2, opts);
  };
});

// ../../node_modules/gray-matter/index.js
var require_gray_matter = __commonJS((exports, module) => {
  var fs = __require("fs");
  var sections = require_section_matter();
  var defaults = require_defaults();
  var stringify = require_stringify();
  var excerpt = require_excerpt();
  var engines = require_engines();
  var toFile = require_to_file();
  var parse2 = require_parse();
  var utils = require_utils();
  function matter(input, options2) {
    if (input === "") {
      return { data: {}, content: input, excerpt: "", orig: input };
    }
    let file = toFile(input);
    const cached = matter.cache[file.content];
    if (!options2) {
      if (cached) {
        file = Object.assign({}, cached);
        file.orig = cached.orig;
        return file;
      }
      matter.cache[file.content] = file;
    }
    return parseMatter(file, options2);
  }
  function parseMatter(file, options2) {
    const opts = defaults(options2);
    const open = opts.delimiters[0];
    const close = `
` + opts.delimiters[1];
    let str2 = file.content;
    if (opts.language) {
      file.language = opts.language;
    }
    const openLen = open.length;
    if (!utils.startsWith(str2, open, openLen)) {
      excerpt(file, opts);
      return file;
    }
    if (str2.charAt(openLen) === open.slice(-1)) {
      return file;
    }
    str2 = str2.slice(openLen);
    const len = str2.length;
    const language = matter.language(str2, opts);
    if (language.name) {
      file.language = language.name;
      str2 = str2.slice(language.raw.length);
    }
    let closeIndex = str2.indexOf(close);
    if (closeIndex === -1) {
      closeIndex = len;
    }
    file.matter = str2.slice(0, closeIndex);
    const block = file.matter.replace(/^\s*#[^\n]+/gm, "").trim();
    if (block === "") {
      file.isEmpty = true;
      file.empty = file.content;
      file.data = {};
    } else {
      file.data = parse2(file.language, file.matter, opts);
    }
    if (closeIndex === len) {
      file.content = "";
    } else {
      file.content = str2.slice(closeIndex + close.length);
      if (file.content[0] === "\r") {
        file.content = file.content.slice(1);
      }
      if (file.content[0] === `
`) {
        file.content = file.content.slice(1);
      }
    }
    excerpt(file, opts);
    if (opts.sections === true || typeof opts.section === "function") {
      sections(file, opts.section);
    }
    return file;
  }
  matter.engines = engines;
  matter.stringify = function(file, data, options2) {
    if (typeof file === "string")
      file = matter(file, options2);
    return stringify(file, data, options2);
  };
  matter.read = function(filepath, options2) {
    const str2 = fs.readFileSync(filepath, "utf8");
    const file = matter(str2, options2);
    file.path = filepath;
    return file;
  };
  matter.test = function(str2, options2) {
    return utils.startsWith(str2, defaults(options2).delimiters[0]);
  };
  matter.language = function(str2, options2) {
    const opts = defaults(options2);
    const open = opts.delimiters[0];
    if (matter.test(str2)) {
      str2 = str2.slice(open.length);
    }
    const language = str2.slice(0, str2.search(/\r?\n/));
    return {
      raw: language,
      name: language ? language.trim() : ""
    };
  };
  matter.cache = {};
  matter.clearCache = function() {
    matter.cache = {};
  };
  module.exports = matter;
});

// ../core/src/extractor/validator.ts
function validateFerretSchema(shape, filePath) {
  const warnings = [];
  if (shape === null || typeof shape !== "object") {
    return { valid: true, warnings };
  }
  const serialised = JSON.stringify(shape);
  for (const keyword of UNSUPPORTED_KEYWORDS) {
    if (serialised.includes(`"${keyword}"`)) {
      warnings.push(`\u26A0 Unsupported JSON Schema keyword: ${keyword} in ${filePath}
` + `  Ferret supports a subset of JSON Schema.
` + `  See: spec/CONTRACT-SCHEMA.md \u2014 Part 3`);
    }
  }
  return { valid: true, warnings };
}
function compareSchemas(previous, current) {
  const prev = typeof previous === "object" && previous !== null ? previous : {};
  const curr = typeof current === "object" && current !== null ? current : {};
  if (prev.type !== undefined && curr.type !== undefined && prev.type !== curr.type) {
    return { classification: "breaking", reason: `type changed from '${prev.type}' to '${curr.type}'` };
  }
  const prevRequired = normaliseRequired(prev.required);
  const currRequired = normaliseRequired(curr.required);
  const removedRequired = prevRequired.filter((f) => !currRequired.includes(f));
  if (removedRequired.length > 0) {
    return { classification: "breaking", reason: `required field(s) removed: ${removedRequired.join(", ")}` };
  }
  const addedRequired = currRequired.filter((f) => !prevRequired.includes(f));
  if (addedRequired.length > 0) {
    return { classification: "breaking", reason: `required field(s) added: ${addedRequired.join(", ")}` };
  }
  const prevEnum = normaliseEnum(prev.enum);
  const currEnum = normaliseEnum(curr.enum);
  if (prevEnum !== null && currEnum !== null) {
    const removedEnum = prevEnum.filter((v) => !currEnum.includes(v));
    if (removedEnum.length > 0) {
      return { classification: "breaking", reason: `enum value(s) removed: ${removedEnum.join(", ")}` };
    }
    const addedEnum = currEnum.filter((v) => !prevEnum.includes(v));
    if (addedEnum.length > 0) {
      return { classification: "non-breaking", reason: `enum value(s) added: ${addedEnum.join(", ")}` };
    }
  }
  const prevProps = prev.properties ?? {};
  const currProps = curr.properties ?? {};
  for (const key of Object.keys(currProps)) {
    if (!(key in prevProps)) {
      if (currRequired.includes(key)) {
        return { classification: "breaking", reason: `required field added: ${key}` };
      }
      continue;
    }
    const nested = compareSchemas(prevProps[key], currProps[key]);
    if (nested.classification === "breaking") {
      return { classification: "breaking", reason: `property '${key}': ${nested.reason}` };
    }
    if (nested.classification === "non-breaking") {
      return { classification: "non-breaking", reason: `property '${key}': ${nested.reason}` };
    }
  }
  for (const key of Object.keys(prevProps)) {
    if (!(key in currProps)) {
      return { classification: "breaking", reason: `property '${key}' removed` };
    }
  }
  for (const wrapper of ["request", "response"]) {
    if (prev[wrapper] !== undefined || curr[wrapper] !== undefined) {
      const nested = compareSchemas(prev[wrapper] ?? {}, curr[wrapper] ?? {});
      if (nested.classification === "breaking") {
        return { classification: "breaking", reason: `${wrapper}: ${nested.reason}` };
      }
      if (nested.classification === "non-breaking") {
        return { classification: "non-breaking", reason: `${wrapper}: ${nested.reason}` };
      }
    }
  }
  if (prev.items !== undefined && curr.items !== undefined) {
    const nested = compareSchemas(prev.items, curr.items);
    if (nested.classification === "breaking") {
      return { classification: "breaking", reason: `array items: ${nested.reason}` };
    }
    if (nested.classification === "non-breaking") {
      return { classification: "non-breaking", reason: `array items: ${nested.reason}` };
    }
  }
  const newOptionalKeys = Object.keys(currProps).filter((k) => !(k in prevProps) && !currRequired.includes(k));
  if (newOptionalKeys.length > 0) {
    return { classification: "non-breaking", reason: `optional field(s) added: ${newOptionalKeys.join(", ")}` };
  }
  return { classification: "no-change", reason: "schemas are semantically identical" };
}
function normaliseRequired(required) {
  if (!Array.isArray(required))
    return [];
  return required.filter((v) => typeof v === "string");
}
function normaliseEnum(enumVal) {
  if (!Array.isArray(enumVal))
    return null;
  return enumVal.map((v) => String(v));
}
var UNSUPPORTED_KEYWORDS;
var init_validator = __esm(() => {
  UNSUPPORTED_KEYWORDS = [
    "$ref",
    "allOf",
    "anyOf",
    "oneOf",
    "not",
    "if",
    "then",
    "else",
    "$defs",
    "definitions",
    "patternProperties",
    "dependencies"
  ];
});

// ../core/src/extractor/hash.ts
import { createHash } from "crypto";
function hashSchema(schema) {
  const sortObject = (obj) => {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortObject);
    }
    return Object.keys(obj).sort().reduce((acc, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
  };
  const stable = JSON.stringify(sortObject(schema));
  return createHash("sha256").update(stable).digest("hex");
}
var init_hash = () => {};

// ../core/src/extractor/frontmatter.ts
function extractFromSpecFile(filePath, fileContent) {
  const { data } = import_gray_matter.default(fileContent);
  const ferret = data?.ferret;
  if (!ferret) {
    return {
      filePath,
      fileType: "spec",
      contracts: [],
      extractedBy: "gray-matter",
      extractedAt: Date.now(),
      warning: "no-frontmatter"
    };
  }
  const missingFields = ["id", "type", "shape"].filter((f) => !ferret[f]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required frontmatter fields in ${filePath}: ${missingFields.join(", ")}`);
  }
  const validation = validateFerretSchema(ferret.shape, filePath);
  validation.warnings.forEach((w) => process.stderr.write(w + `
`));
  return {
    filePath,
    fileType: "spec",
    contracts: [{
      id: ferret.id,
      type: ferret.type,
      shape: ferret.shape,
      shape_hash: hashSchema(ferret.shape),
      imports: Array.isArray(ferret.imports) ? ferret.imports : []
    }],
    extractedBy: "gray-matter",
    extractedAt: Date.now()
  };
}
var import_gray_matter;
var init_frontmatter = __esm(() => {
  init_validator();
  init_hash();
  import_gray_matter = __toESM(require_gray_matter(), 1);
});

// ../core/src/extractor/typescript.ts
class TypeParser {
  input;
  i = 0;
  constructor(input) {
    this.input = input;
  }
  parseObject() {
    const diagnostics = [];
    const object = this.parseObjectType(diagnostics);
    return { shape: object, diagnostics };
  }
  parseObjectType(diagnostics) {
    this.skipWs();
    if (this.peek() !== "{") {
      diagnostics.push("Expected object type starting with '{'.");
      return { type: "object", properties: {}, required: [] };
    }
    this.i++;
    const properties = {};
    const required = [];
    while (this.i < this.input.length) {
      this.skipWs();
      if (this.peek() === "}") {
        this.i++;
        break;
      }
      const name = this.readIdentifier();
      if (!name) {
        diagnostics.push("Unable to parse property name in object type.");
        this.advanceToDelimiter();
        continue;
      }
      this.skipWs();
      let optional = false;
      if (this.peek() === "?") {
        optional = true;
        this.i++;
      }
      this.skipWs();
      if (this.peek() !== ":") {
        diagnostics.push(`Expected ':' after property '${name}'.`);
        this.advanceToDelimiter();
        continue;
      }
      this.i++;
      this.skipWs();
      const schema = this.parseTypeExpr(diagnostics);
      properties[name] = schema;
      if (!optional) {
        required.push(name);
      }
      this.skipWs();
      if (this.peek() === ";" || this.peek() === ",") {
        this.i++;
      }
    }
    return {
      type: "object",
      properties,
      required
    };
  }
  parseTypeExpr(diagnostics) {
    this.skipWs();
    if (this.peek() === "{") {
      return this.parseObjectType(diagnostics);
    }
    const ident = this.readIdentifier();
    if (!ident) {
      diagnostics.push("Unable to parse type expression.");
      return { type: "object" };
    }
    let base;
    switch (ident) {
      case "string":
        base = { type: "string" };
        break;
      case "number":
        base = { type: "number" };
        break;
      case "boolean":
        base = { type: "boolean" };
        break;
      case "Date":
        base = { type: "string", format: "date-time" };
        break;
      default:
        diagnostics.push(`Unsupported referenced type '${ident}'. Falling back to object.`);
        base = { type: "object" };
        break;
    }
    while (true) {
      this.skipWs();
      if (this.peek() === "[" && this.peek(1) === "]") {
        this.i += 2;
        base = { type: "array", items: base };
        continue;
      }
      break;
    }
    this.skipWs();
    if (this.peek() === "|") {
      diagnostics.push("Union types are not supported in Sprint 3 extraction.");
      while (this.i < this.input.length) {
        const ch = this.peek();
        if (ch === ";" || ch === "," || ch === "}" || ch === `
`) {
          break;
        }
        this.i++;
      }
    }
    return base;
  }
  readIdentifier() {
    this.skipWs();
    const start = this.i;
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      const ok = /[A-Za-z0-9_]/.test(ch);
      if (!ok) {
        break;
      }
      this.i++;
    }
    return this.input.slice(start, this.i);
  }
  skipWs() {
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      if (!/\s/.test(ch)) {
        break;
      }
      this.i++;
    }
  }
  advanceToDelimiter() {
    while (this.i < this.input.length) {
      const ch = this.input[this.i];
      if (ch === ";" || ch === `
` || ch === "}") {
        return;
      }
      this.i++;
    }
  }
  peek(offset = 0) {
    return this.input[this.i + offset] ?? "";
  }
}
function parseAnnotations(content) {
  const pattern = /^\s*\/\/\s*@ferret-contract:\s*([^\s]+)\s+(api|table|type|event|flow|config)\s*$/gm;
  const out = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    out.push({
      id: match[1],
      type: match[2],
      index: match.index + match[0].length
    });
  }
  return out;
}
function extractDeclaration(content, start) {
  const tail = content.slice(start);
  const decl = /(?:export\s+)?(interface|type)\s+([A-Za-z0-9_]+)\s*(?:=)?\s*/m.exec(tail);
  if (!decl || decl.index === undefined) {
    return {
      symbol: "unknown",
      objectBody: "",
      error: "No interface/type declaration found after annotation."
    };
  }
  const symbol = decl[2];
  const offset = start + decl.index + decl[0].length;
  const bodyStart = content.indexOf("{", offset);
  if (bodyStart === -1) {
    return {
      symbol,
      objectBody: "",
      error: `Declaration '${symbol}' is not an object-like type.`
    };
  }
  let depth = 0;
  let end = -1;
  for (let i = bodyStart;i < content.length; i++) {
    const ch = content[i];
    if (ch === "{")
      depth++;
    if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) {
    return {
      symbol,
      objectBody: "",
      error: `Unclosed object type for declaration '${symbol}'.`
    };
  }
  const objectBody = content.slice(bodyStart, end + 1);
  return { symbol, objectBody };
}
function extractContractsFromTypeScript(filePath, content) {
  const annotations = parseAnnotations(content);
  const contracts = [];
  const diagnostics = [];
  for (const annotation of annotations) {
    const declaration = extractDeclaration(content, annotation.index);
    if (declaration.error) {
      diagnostics.push(`${filePath}: ${declaration.error}`);
      continue;
    }
    const parser = new TypeParser(declaration.objectBody);
    const { shape, diagnostics: parserDiagnostics } = parser.parseObject();
    for (const d of parserDiagnostics) {
      diagnostics.push(`${filePath} (${declaration.symbol}): ${d}`);
    }
    contracts.push({
      id: annotation.id,
      type: annotation.type,
      shape,
      sourceSymbol: declaration.symbol,
      filePath
    });
  }
  contracts.sort((a, b) => a.id.localeCompare(b.id));
  return { contracts, diagnostics };
}

// ../core/src/context/index.ts
import * as fs from "fs";
import * as path from "path";
async function writeContext(store, projectRoot) {
  const [nodes, contracts, dependencies] = await Promise.all([
    store.getNodes(),
    store.getContracts(),
    store.getDependencies()
  ]);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const contextContracts = contracts.map((c) => {
    const parentNode = nodeById.get(c.node_id);
    const nodeType = parentNode?.type ?? "spec";
    let shape = {};
    try {
      shape = JSON.parse(c.shape_schema);
    } catch {
      shape = {};
    }
    return {
      id: c.id,
      type: c.type,
      shape,
      status: c.status,
      specFile: nodeType !== "code" ? parentNode?.file_path ?? null : null,
      codeFile: nodeType === "code" ? parentNode?.file_path ?? null : null
    };
  });
  const edges = dependencies.map((d) => {
    const sourceNode = nodeById.get(d.source_node_id);
    return {
      from: sourceNode?.file_path ?? d.source_node_id,
      to: d.target_contract_id
    };
  });
  const needsReviewNodeIds = new Set(nodes.filter((n) => n.status === "needs-review").map((n) => n.id));
  const needsReview = contracts.filter((c) => needsReviewNodeIds.has(c.node_id) || c.status === "needs-review").map((c) => c.id);
  const context = {
    version: "2.0",
    generated: new Date().toISOString(),
    contracts: contextContracts,
    edges,
    needsReview
  };
  const ferretDir = path.join(projectRoot, ".ferret");
  const contextPath = path.join(ferretDir, "context.json");
  try {
    if (!fs.existsSync(ferretDir)) {
      fs.mkdirSync(ferretDir, { recursive: true });
    }
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), "utf-8");
  } catch (err) {
    process.stderr.write(`\u26A0 Could not write context.json: ${err}
`);
  }
}
var init_context = () => {};
// ../core/src/utils/paths.ts
import * as fs2 from "fs";
import * as path2 from "path";
function findProjectRoot(startDir = process.cwd()) {
  let current = path2.resolve(startDir);
  for (let i = 0;i < 20; i++) {
    if (fs2.existsSync(path2.join(current, ".ferret")) || fs2.existsSync(path2.join(current, "ferret.config.json"))) {
      return current;
    }
    const parent = path2.dirname(current);
    if (parent === current)
      break;
    current = parent;
  }
  return path2.resolve(startDir);
}
var init_paths = () => {};

// ../core/src/store/sqlite.ts
import { Database } from "bun:sqlite";
import * as path3 from "path";
import * as fs3 from "fs";
import { randomUUID } from "crypto";

class SqliteStore {
  db = null;
  dbPath;
  constructor(customPath) {
    const root = findProjectRoot();
    const defaultPath = path3.join(root, ".ferret", "graph.db");
    this.dbPath = customPath === ":memory:" ? ":memory:" : customPath ? path3.resolve(root, customPath) : defaultPath;
  }
  async init() {
    if (this.db)
      return;
    if (this.dbPath !== ":memory:") {
      const ferretDir = path3.dirname(this.dbPath);
      if (!fs3.existsSync(ferretDir)) {
        fs3.mkdirSync(ferretDir, { recursive: true });
      }
      const gitignorePath = path3.join(ferretDir, ".gitignore");
      try {
        fs3.writeFileSync(gitignorePath, `*
!.gitignore
!context.json
`, "utf-8");
      } catch {}
    }
    this.db = new Database(this.dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ferret_nodes (
        id TEXT PRIMARY KEY,
        file_path TEXT NOT NULL,
        hash TEXT NOT NULL,
        status TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ferret_contracts (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        shape_hash TEXT NOT NULL,
        shape_schema TEXT NOT NULL DEFAULT '{}',
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (node_id) REFERENCES ferret_nodes(id)
      );

      CREATE TABLE IF NOT EXISTS ferret_dependencies (
        id TEXT PRIMARY KEY,
        source_node_id TEXT NOT NULL,
        target_contract_id TEXT NOT NULL,
        FOREIGN KEY (source_node_id) REFERENCES ferret_nodes(id)
      );

      CREATE TABLE IF NOT EXISTS ferret_reconciliation_log (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        triggered_by TEXT NOT NULL,
        resolved_by TEXT,
        resolution_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS ferret_placement_decisions (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        placed_by TEXT NOT NULL,
        reasoning TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    try {
      this.db.exec(`ALTER TABLE ferret_contracts ADD COLUMN shape_schema TEXT NOT NULL DEFAULT '{}';`);
    } catch {}
  }
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
  async getNodeByFilePath(filePath) {
    const row = this.db.prepare("SELECT * FROM ferret_nodes WHERE file_path = ?").get(filePath);
    return row ?? null;
  }
  async upsertNode(node) {
    this.db.prepare(`
      INSERT INTO ferret_nodes (id, file_path, hash, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        file_path = excluded.file_path,
        hash = excluded.hash,
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `).run(node.id, node.file_path, node.hash, node.status);
  }
  async getAllContractIds() {
    return this.db.prepare("SELECT id FROM ferret_contracts").all().map((r) => r.id);
  }
  async upsertContract(contract) {
    this.db.prepare(`
      INSERT INTO ferret_contracts (id, node_id, shape_hash, shape_schema, type, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        node_id = excluded.node_id,
        shape_hash = excluded.shape_hash,
        shape_schema = excluded.shape_schema,
        type = excluded.type,
        status = excluded.status
    `).run(contract.id, contract.node_id, contract.shape_hash, contract.shape_schema, contract.type, contract.status);
  }
  async upsertDependency(dependency) {
    this.db.prepare(`
      INSERT INTO ferret_dependencies (id, source_node_id, target_contract_id)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `).run(dependency.id, dependency.source_node_id, dependency.target_contract_id);
  }
  async replaceDependenciesForSourceNode(sourceNodeId, targetContractIds) {
    const uniqueTargets = [...new Set(targetContractIds)].sort();
    const deleteStatement = this.db.prepare("DELETE FROM ferret_dependencies WHERE source_node_id = ?");
    const insertStatement = this.db.prepare(`
      INSERT INTO ferret_dependencies (id, source_node_id, target_contract_id)
      VALUES (?, ?, ?)
    `);
    const transaction = this.db.transaction((sourceId) => {
      deleteStatement.run(sourceId);
      for (const targetId of uniqueTargets) {
        insertStatement.run(randomUUID(), sourceId, targetId);
      }
    });
    transaction(sourceNodeId);
  }
  async getNodes() {
    return this.db.prepare("SELECT * FROM ferret_nodes").all();
  }
  async getNodesByStatus(status) {
    return this.db.prepare("SELECT * FROM ferret_nodes WHERE status = ?").all(status);
  }
  async getContracts() {
    return this.db.prepare("SELECT * FROM ferret_contracts").all();
  }
  async getContract(id) {
    const row = this.db.prepare("SELECT * FROM ferret_contracts WHERE id = ?").get(id);
    return row ?? null;
  }
  async getDependencies() {
    return this.db.prepare("SELECT * FROM ferret_dependencies").all();
  }
  async updateNodeStatus(nodeId, status) {
    this.db.prepare("UPDATE ferret_nodes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, nodeId);
  }
  async insertReconciliationLog(log) {
    this.db.prepare(`
      INSERT INTO ferret_reconciliation_log (id, node_id, triggered_by, resolved_by, resolution_notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(log.id, log.node_id, log.triggered_by, log.resolved_by ?? null, log.resolution_notes ?? null);
  }
  async getReconciliationLogs() {
    return this.db.prepare("SELECT id, node_id, triggered_by, resolved_by, resolution_notes FROM ferret_reconciliation_log").all();
  }
  async insertPlacementDecision(decision) {
    this.db.prepare(`
      INSERT INTO ferret_placement_decisions (id, node_id, placed_by, reasoning)
      VALUES (?, ?, ?, ?)
    `).run(decision.id, decision.node_id, decision.placed_by, decision.reasoning ?? null);
  }
  async getPlacementDecisions() {
    return this.db.prepare("SELECT id, node_id, placed_by, reasoning FROM ferret_placement_decisions").all();
  }
}
var init_sqlite = __esm(() => {
  init_paths();
});

// ../core/src/store/postgres.ts
class PostgresStore {
  connectionString;
  constructor(connectionString) {
    this.connectionString = connectionString;
  }
  notImplemented() {
    throw new Error("PostgresStore: Postgres support is Sprint 2 roadmap. " + 'Set FERRET_DATABASE_URL to use Postgres, or remove the store: "postgres" config to use SQLite.');
  }
  async init() {
    this.notImplemented();
  }
  async close() {
    this.notImplemented();
  }
  async getNodeByFilePath(_filePath) {
    this.notImplemented();
  }
  async upsertNode(_node) {
    this.notImplemented();
  }
  async getAllContractIds() {
    this.notImplemented();
  }
  async upsertContract(_contract) {
    this.notImplemented();
  }
  async upsertDependency(_dependency) {
    this.notImplemented();
  }
  async replaceDependenciesForSourceNode(_sourceNodeId, _targetNodeIds) {
    this.notImplemented();
  }
  async getNodes() {
    this.notImplemented();
  }
  async getNodesByStatus(_status) {
    this.notImplemented();
  }
  async getContracts() {
    this.notImplemented();
  }
  async getContract(_id) {
    this.notImplemented();
  }
  async getDependencies() {
    this.notImplemented();
  }
  async updateNodeStatus(_nodeId, _status) {
    this.notImplemented();
  }
  async insertReconciliationLog(_log) {
    this.notImplemented();
  }
  async getReconciliationLogs() {
    this.notImplemented();
  }
  async insertPlacementDecision(_decision) {
    this.notImplemented();
  }
  async getPlacementDecisions() {
    this.notImplemented();
  }
}

// ../core/src/config.ts
import * as fs4 from "fs";
import * as path4 from "path";
function loadConfig() {
  const root = findProjectRoot();
  const configPath = path4.join(root, "ferret.config.json");
  if (!fs4.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs4.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
var DEFAULT_CONFIG;
var init_config = __esm(() => {
  init_paths();
  DEFAULT_CONFIG = {
    specDir: "contracts/",
    filePattern: "**/*.contract.md",
    includes: ["**/*.contract.md"],
    store: "sqlite",
    importSuggestions: {
      enabled: true
    }
  };
});

// ../core/src/store/factory.ts
import * as fs5 from "fs/promises";
import * as path5 from "path";
async function getStore() {
  const envUrl = process.env.FERRET_DATABASE_URL;
  if (envUrl) {
    const store = new PostgresStore(envUrl);
    return store;
  }
  try {
    const config = await loadConfig();
    if (config.store === "postgres") {
      console.error("FATAL: ferret.config.json sets store to postgres but FERRET_DATABASE_URL is not set. Source your .env file or set the variable in your environment.");
      process.exit(1);
    }
  } catch {}
  const dbPath = path5.join(findProjectRoot(), ".ferret", "graph.db");
  try {
    await fs5.access(dbPath);
    return new SqliteStore;
  } catch (err) {
    if (process.env.FERRET_CI === "true") {
      console.error("FATAL: FERRET_CI is true, but no database configuration found.");
      process.exit(1);
    }
    return new SqliteStore;
  }
}
var init_factory = __esm(() => {
  init_sqlite();
  init_config();
  init_paths();
});

// ../core/src/reconciler/import-suggestions.ts
function suggestMissingImports(nodes, contracts, dependencies) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const nodeImportMap = new Map;
  for (const dependency of dependencies) {
    const imports = nodeImportMap.get(dependency.source_node_id) ?? new Set;
    imports.add(dependency.target_contract_id);
    nodeImportMap.set(dependency.source_node_id, imports);
  }
  const schemaKeysByContract = new Map;
  for (const contract of contracts) {
    schemaKeysByContract.set(contract.id, extractSchemaKeys(parseSchema(contract.shape_schema)));
  }
  const suggestions = [];
  const seen = new Set;
  for (const source of contracts) {
    const sourceKeys = schemaKeysByContract.get(source.id) ?? new Set;
    if (sourceKeys.size === 0) {
      continue;
    }
    const importedTargets = nodeImportMap.get(source.node_id) ?? new Set;
    const sourceNode = nodeById.get(source.node_id);
    if (!sourceNode) {
      continue;
    }
    const rankedCandidates = contracts.filter((target) => target.id !== source.id && !importedTargets.has(target.id)).map((target) => {
      const targetKeys = schemaKeysByContract.get(target.id) ?? new Set;
      const sharedKeys = intersectSets(sourceKeys, targetKeys);
      const overlap = sourceKeys.size === 0 ? 0 : sharedKeys.length / sourceKeys.size;
      return {
        target,
        targetKeys,
        sharedKeys,
        overlap
      };
    }).filter((candidate) => candidate.sharedKeys.length >= 2 && candidate.overlap >= 0.67 && candidate.targetKeys.size >= sourceKeys.size).sort((left, right) => {
      if (right.sharedKeys.length !== left.sharedKeys.length) {
        return right.sharedKeys.length - left.sharedKeys.length;
      }
      if (right.overlap !== left.overlap) {
        return right.overlap - left.overlap;
      }
      return left.target.id.localeCompare(right.target.id);
    }).slice(0, 3);
    for (const candidate of rankedCandidates) {
      const confidence = candidate.sharedKeys.length >= 3 || candidate.overlap >= 0.75 ? "high" : "medium";
      const key = `${source.id}->${candidate.target.id}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      suggestions.push({
        sourceContractId: source.id,
        sourceFilePath: sourceNode.file_path,
        suggestedImportId: candidate.target.id,
        confidence,
        evidence: `shared shape keys: ${candidate.sharedKeys.slice(0, 3).join(", ")}`
      });
    }
  }
  return suggestions.sort((left, right) => {
    if (left.sourceContractId !== right.sourceContractId) {
      return left.sourceContractId.localeCompare(right.sourceContractId);
    }
    return left.suggestedImportId.localeCompare(right.suggestedImportId);
  });
}
function parseSchema(shapeSchema) {
  try {
    return JSON.parse(shapeSchema);
  } catch {
    return {};
  }
}
function extractSchemaKeys(schema) {
  const keys = new Set;
  const walk = (value) => {
    if (!value || typeof value !== "object") {
      return;
    }
    const record = value;
    const properties = record.properties;
    if (properties && typeof properties === "object") {
      for (const [key, child] of Object.entries(properties)) {
        keys.add(key);
        walk(child);
      }
    }
    const items = record.items;
    if (items) {
      walk(items);
    }
  };
  walk(schema);
  return keys;
}
function intersectSets(left, right) {
  const shared = [...left].filter((item) => right.has(item));
  return shared.sort((a, b) => a.localeCompare(b));
}

// ../core/src/reconciler/index.ts
class Reconciler {
  store;
  constructor(store) {
    this.store = store;
  }
  async reconcile() {
    const nodes = await this.store.getNodes();
    const contracts = await this.store.getContracts();
    const dependencies = await this.store.getDependencies();
    const integrityViolations = this.validateImportIntegrity(nodes, contracts, dependencies);
    const hasIntegrityViolations = integrityViolations.unresolvedImports.length > 0 || integrityViolations.selfImports.length > 0 || integrityViolations.circularImports.length > 0;
    if (hasIntegrityViolations) {
      return {
        consistent: false,
        flagged: [],
        integrityViolations,
        importSuggestions: [],
        timestamp: new Date().toISOString()
      };
    }
    const importSuggestions = suggestMissingImports(nodes, contracts, dependencies);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const contractMap = new Map(contracts.map((c) => [c.id, c]));
    const triggerContracts = contracts.filter((c) => {
      const parentNode = nodeMap.get(c.node_id);
      return parentNode && parentNode.status === "needs-review";
    });
    const flaggedNodes = [];
    const queue = triggerContracts.map((c) => [
      c.id,
      1
    ]);
    const visitedContracts = new Set;
    while (queue.length > 0) {
      const [contractId, depth] = queue.shift();
      if (visitedContracts.has(contractId) || depth > 10)
        continue;
      visitedContracts.add(contractId);
      const dependentEdges = dependencies.filter((d) => d.target_contract_id === contractId);
      for (const edge of dependentEdges) {
        const dependentNodeId = edge.source_node_id;
        const dependentNode = nodeMap.get(dependentNodeId);
        if (!dependentNode)
          continue;
        if (dependentNode.status === "needs-review" || dependentNode.status === "roadmap") {
          continue;
        }
        await this.store.updateNodeStatus(dependentNode.id, "needs-review");
        dependentNode.status = "needs-review";
        flaggedNodes.push({
          nodeId: dependentNode.id,
          filePath: dependentNode.file_path,
          triggeredByContractId: contractId,
          impact: depth === 1 ? "direct" : "transitive",
          depth
        });
        const cascadingContracts = contracts.filter((c) => c.node_id === dependentNode.id);
        for (const cContract of cascadingContracts) {
          queue.push([cContract.id, depth + 1]);
        }
      }
    }
    return {
      consistent: flaggedNodes.length === 0 && nodes.every((n) => n.status === "stable" || n.status === "roadmap"),
      flagged: flaggedNodes,
      integrityViolations,
      importSuggestions,
      timestamp: new Date().toISOString()
    };
  }
  validateImportIntegrity(nodes, contracts, dependencies) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
    const contractsByNodeId = new Map;
    for (const contract of contracts) {
      const existing = contractsByNodeId.get(contract.node_id) ?? [];
      existing.push(contract);
      contractsByNodeId.set(contract.node_id, existing);
    }
    const dependencyKeys = new Set;
    const uniqueDependencies = dependencies.filter((dependency) => {
      const key = `${dependency.source_node_id}->${dependency.target_contract_id}`;
      if (dependencyKeys.has(key)) {
        return false;
      }
      dependencyKeys.add(key);
      return true;
    });
    const unresolvedImports = [];
    const selfImports = [];
    const adjacency = new Map;
    for (const contract of contracts) {
      adjacency.set(contract.id, new Set);
    }
    for (const dependency of uniqueDependencies) {
      const sourceNode = nodeById.get(dependency.source_node_id);
      const sourceContracts = contractsByNodeId.get(dependency.source_node_id) ?? [];
      const targetContract = contractById.get(dependency.target_contract_id);
      if (!sourceNode || sourceContracts.length === 0) {
        continue;
      }
      if (!targetContract) {
        for (const sourceContract of sourceContracts) {
          unresolvedImports.push({
            contractId: sourceContract.id,
            filePath: sourceNode.file_path,
            importPath: dependency.target_contract_id
          });
        }
        continue;
      }
      const selfImportingContracts = sourceContracts.filter((sourceContract) => sourceContract.id === dependency.target_contract_id);
      for (const sourceContract of selfImportingContracts) {
        selfImports.push({
          contractId: sourceContract.id,
          filePath: sourceNode.file_path,
          importPath: dependency.target_contract_id
        });
      }
      for (const sourceContract of sourceContracts) {
        if (sourceContract.id === dependency.target_contract_id) {
          continue;
        }
        adjacency.get(sourceContract.id)?.add(dependency.target_contract_id);
      }
    }
    const circularImports = this.findCircularImports(adjacency, contractById, nodeById);
    return {
      unresolvedImports,
      selfImports,
      circularImports
    };
  }
  findCircularImports(adjacency, contractById, nodeById) {
    const visited = new Set;
    const path6 = [];
    const cycleMap = new Map;
    const contractIds = [...adjacency.keys()].sort();
    const visit = (contractId) => {
      visited.add(contractId);
      path6.push(contractId);
      const neighbors = [...adjacency.get(contractId) ?? []].sort();
      for (const neighborId of neighbors) {
        const existingIndex = path6.indexOf(neighborId);
        if (existingIndex !== -1) {
          const cycle = [...path6.slice(existingIndex), neighborId];
          const key = canonicalizeCycle(cycle);
          if (!cycleMap.has(key)) {
            const sourceContractId = cycle[0];
            const sourceContract = contractById.get(sourceContractId);
            const sourceNode = sourceContract ? nodeById.get(sourceContract.node_id) : undefined;
            cycleMap.set(key, {
              contractId: sourceContractId,
              filePath: sourceNode?.file_path ?? sourceContractId,
              importPath: cycle.join(" -> "),
              cycle
            });
          }
          continue;
        }
        if (!visited.has(neighborId)) {
          visit(neighborId);
        }
      }
      path6.pop();
    };
    for (const contractId of contractIds) {
      if (!visited.has(contractId)) {
        visit(contractId);
      }
    }
    return [...cycleMap.values()].sort((left, right) => left.importPath.localeCompare(right.importPath));
  }
}
function canonicalizeCycle(cycle) {
  const ring = cycle.slice(0, -1);
  if (ring.length === 0) {
    return "";
  }
  const rotations = ring.map((_, index) => {
    const rotated = [...ring.slice(index), ...ring.slice(0, index)];
    return `${rotated.join("->")}->${rotated[0]}`;
  });
  return rotations.sort()[0];
}
var init_reconciler = () => {};

// ../core/src/index.ts
var init_src = __esm(() => {
  init_frontmatter();
  init_validator();
  init_hash();
  init_context();
  init_sqlite();
  init_factory();
  init_reconciler();
  init_config();
  init_paths();
});

// bin/commands/init.ts
var exports_init = {};
__export(exports_init, {
  initCommand: () => initCommand
});
import * as fs6 from "fs";
import * as path6 from "path";
function installHook(root) {
  const gitHooksDir = path6.join(root, ".git", "hooks");
  if (!fs6.existsSync(gitHooksDir))
    return "unavailable";
  const hookPath = path6.join(gitHooksDir, "pre-commit");
  if (fs6.existsSync(hookPath)) {
    return "exists";
  }
  fs6.writeFileSync(hookPath, PRE_COMMIT_HOOK, {
    mode: 493,
    encoding: "utf-8"
  });
  return "installed";
}
var EXAMPLE_SPEC = `---
ferret:
  id: api.GET/example
  type: api
  shape:
    response:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
            format: uuid
          name:
            type: string
        required: [id, name]
---

# Example Endpoint

Replace this with your first real spec.
Everything below the frontmatter is free-form prose.
Ferret never reads it.
`, CLAUDE_MD_CONTENT = `# CLAUDE.md

## Ferret Contract Graph

Always read \`.ferret/context.json\` before generating any code.
This is the live contract graph. Treat it as ground truth over any contract file.

Contract files live in \`contracts/\` and use the \`.contract.md\` extension.
Do not edit contract files without running \`ferret lint\` afterward.

Run \`ferret lint\` before generating any code that touches contracts.
`, DEFAULT_CONFIG2, PRE_COMMIT_HOOK = `#!/bin/sh
# Ferret pre-commit hook \u2014 installed by \`ferret init\`
ferret lint --changed
`, initCommand;
var init_init = __esm(() => {
  init_esm();
  init_src();
  DEFAULT_CONFIG2 = {
    specDir: "contracts/",
    filePattern: "**/*.contract.md",
    includes: ["**/*.contract.md"],
    store: "sqlite",
    importSuggestions: {
      enabled: true
    },
    codeContracts: {
      include: ["src/**/*.ts"]
    }
  };
  initCommand = new Command("init").description("Initialise SpecFerret in the current project.").option("--no-hook", "Skip pre-commit hook installation").action(async (options2) => {
    const root = process.cwd();
    const ferretDir = path6.join(root, ".ferret");
    const dbPath = path6.join(ferretDir, "graph.db");
    if (fs6.existsSync(dbPath)) {
      process.stdout.write(`Already initialised.
`);
      process.exit(0);
    }
    const store = new SqliteStore(dbPath);
    await store.init();
    await store.close();
    const contractsDir = path6.join(root, "contracts");
    if (!fs6.existsSync(contractsDir)) {
      fs6.mkdirSync(contractsDir, { recursive: true });
    }
    const examplePath = path6.join(contractsDir, "example.contract.md");
    if (!fs6.existsSync(examplePath)) {
      fs6.writeFileSync(examplePath, EXAMPLE_SPEC, "utf-8");
    }
    const claudePath = path6.join(root, "CLAUDE.md");
    if (!fs6.existsSync(claudePath)) {
      fs6.writeFileSync(claudePath, CLAUDE_MD_CONTENT, "utf-8");
    }
    const configPath = path6.join(root, "ferret.config.json");
    if (!fs6.existsSync(configPath)) {
      fs6.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG2, null, 2) + `
`, "utf-8");
    }
    process.stdout.write(`\u2713 ferret initialised
`);
    process.stdout.write(`  .ferret/graph.db     created
`);
    process.stdout.write(`  contracts/example.contract.md  created
`);
    process.stdout.write(`  CLAUDE.md            created
`);
    process.stdout.write(`  ferret.config.json   created
`);
    if (options2.hook !== false) {
      const hookResult = installHook(root);
      if (hookResult === "installed") {
        process.stdout.write(`  .git/hooks/pre-commit installed
`);
      } else if (hookResult === "exists") {
        process.stdout.write(`  .git/hooks/pre-commit skipped (already exists)
`);
      } else {
        process.stdout.write(`  .git/hooks/pre-commit skipped (.git/hooks unavailable)
`);
      }
    }
    process.stdout.write(`
Run: ferret lint
`);
  });
});

// ../../node_modules/glob/dist/esm/index.min.js
import { fileURLToPath as Wi } from "url";
import { posix as mi, win32 as re } from "path";
import { fileURLToPath as gi } from "url";
import { lstatSync as wi, readdir as yi, readdirSync as bi, readlinkSync as Si, realpathSync as Ei } from "fs";
import * as xi from "fs";
import { lstat as Ci, readdir as Ti, readlink as Ai, realpath as ki } from "fs/promises";
import { EventEmitter as ee } from "events";
import Pe from "stream";
import { StringDecoder as ni } from "string_decoder";
function Ht(n) {
  return isNaN(n) ? n.charCodeAt(0) : parseInt(n, 10);
}
function ps(n) {
  return n.replace(as, fe).replace(ls, ue).replace(cs, qt).replace(fs7, de).replace(us, pe);
}
function ms(n) {
  return n.replace(is, "\\").replace(rs, "{").replace(ns, "}").replace(os, ",").replace(hs, ".");
}
function me(n) {
  if (!n)
    return [""];
  let t = [], e = Gt("{", "}", n);
  if (!e)
    return n.split(",");
  let { pre: s, body: i, post: r } = e, o = s.split(",");
  o[o.length - 1] += "{" + i + "}";
  let h = me(r);
  return r.length && (o[o.length - 1] += h.shift(), o.push.apply(o, h)), t.push.apply(t, o), t;
}
function ge(n, t = {}) {
  if (!n)
    return [];
  let { max: e = ds } = t;
  return n.slice(0, 2) === "{}" && (n = "\\{\\}" + n.slice(2)), ht(ps(n), e, true).map(ms);
}
function gs(n) {
  return "{" + n + "}";
}
function ws(n) {
  return /^-?0\d/.test(n);
}
function ys(n, t) {
  return n <= t;
}
function bs(n, t) {
  return n >= t;
}
function ht(n, t, e) {
  let s = [], i = Gt("{", "}", n);
  if (!i)
    return [n];
  let r = i.pre, o = i.post.length ? ht(i.post, t, false) : [""];
  if (/\$$/.test(i.pre))
    for (let h = 0;h < o.length && h < t; h++) {
      let a = r + "{" + i.body + "}" + o[h];
      s.push(a);
    }
  else {
    let h = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(i.body), a = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(i.body), l = h || a, u = i.body.indexOf(",") >= 0;
    if (!l && !u)
      return i.post.match(/,(?!,).*\}/) ? (n = i.pre + "{" + i.body + qt + i.post, ht(n, t, true)) : [n];
    let c;
    if (l)
      c = i.body.split(/\.\./);
    else if (c = me(i.body), c.length === 1 && c[0] !== undefined && (c = ht(c[0], t, false).map(gs), c.length === 1))
      return o.map((f) => i.pre + c[0] + f);
    let d;
    if (l && c[0] !== undefined && c[1] !== undefined) {
      let f = Ht(c[0]), m = Ht(c[1]), p = Math.max(c[0].length, c[1].length), w = c.length === 3 && c[2] !== undefined ? Math.abs(Ht(c[2])) : 1, g = ys;
      m < f && (w *= -1, g = bs);
      let E = c.some(ws);
      d = [];
      for (let y = f;g(y, m); y += w) {
        let b;
        if (a)
          b = String.fromCharCode(y), b === "\\" && (b = "");
        else if (b = String(y), E) {
          let z = p - b.length;
          if (z > 0) {
            let $ = new Array(z + 1).join("0");
            y < 0 ? b = "-" + $ + b.slice(1) : b = $ + b;
          }
        }
        d.push(b);
      }
    } else {
      d = [];
      for (let f = 0;f < c.length; f++)
        d.push.apply(d, ht(c[f], t, false));
    }
    for (let f = 0;f < d.length; f++)
      for (let m = 0;m < o.length && s.length < t; m++) {
        let p = r + d[f] + o[m];
        (!e || l || p) && s.push(p);
      }
  }
  return s;
}
function Bt(n7, t = {}) {
  return new I(n7, t).streamSync();
}
function Qe(n7, t = {}) {
  return new I(n7, t).stream();
}
function ts(n7, t = {}) {
  return new I(n7, t).walkSync();
}
async function Je(n7, t = {}) {
  return new I(n7, t).walk();
}
function Ut(n7, t = {}) {
  return new I(n7, t).iterateSync();
}
function es(n7, t = {}) {
  return new I(n7, t).iterate();
}
var Gt = (n, t, e) => {
  let s = n instanceof RegExp ? ce(n, e) : n, i = t instanceof RegExp ? ce(t, e) : t, r = s !== null && i != null && ss(s, i, e);
  return r && { start: r[0], end: r[1], pre: e.slice(0, r[0]), body: e.slice(r[0] + s.length, r[1]), post: e.slice(r[1] + i.length) };
}, ce = (n, t) => {
  let e = t.match(n);
  return e ? e[0] : null;
}, ss = (n, t, e) => {
  let s, i, r, o, h, a = e.indexOf(n), l = e.indexOf(t, a + 1), u = a;
  if (a >= 0 && l > 0) {
    if (n === t)
      return [a, l];
    for (s = [], r = e.length;u >= 0 && !h; ) {
      if (u === a)
        s.push(u), a = e.indexOf(n, u + 1);
      else if (s.length === 1) {
        let c = s.pop();
        c !== undefined && (h = [c, l]);
      } else
        i = s.pop(), i !== undefined && i < r && (r = i, o = l), l = e.indexOf(t, u + 1);
      u = a < l && a >= 0 ? a : l;
    }
    s.length && o !== undefined && (h = [r, o]);
  }
  return h;
}, fe, ue, qt, de, pe, is, rs, ns, os, hs, as, ls, cs, fs7, us, ds = 1e5, at = (n) => {
  if (typeof n != "string")
    throw new TypeError("invalid pattern");
  if (n.length > 65536)
    throw new TypeError("pattern is too long");
}, Ss, lt = (n) => n.replace(/[[\]\\-]/g, "\\$&"), Es = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), we = (n) => n.join(""), ye = (n, t) => {
  let e = t;
  if (n.charAt(e) !== "[")
    throw new Error("not in a brace expression");
  let s = [], i = [], r = e + 1, o = false, h = false, a = false, l = false, u = e, c = "";
  t:
    for (;r < n.length; ) {
      let p = n.charAt(r);
      if ((p === "!" || p === "^") && r === e + 1) {
        l = true, r++;
        continue;
      }
      if (p === "]" && o && !a) {
        u = r + 1;
        break;
      }
      if (o = true, p === "\\" && !a) {
        a = true, r++;
        continue;
      }
      if (p === "[" && !a) {
        for (let [w, [g, S, E]] of Object.entries(Ss))
          if (n.startsWith(w, r)) {
            if (c)
              return ["$.", false, n.length - e, true];
            r += w.length, E ? i.push(g) : s.push(g), h = h || S;
            continue t;
          }
      }
      if (a = false, c) {
        p > c ? s.push(lt(c) + "-" + lt(p)) : p === c && s.push(lt(p)), c = "", r++;
        continue;
      }
      if (n.startsWith("-]", r + 1)) {
        s.push(lt(p + "-")), r += 2;
        continue;
      }
      if (n.startsWith("-", r + 1)) {
        c = p, r += 2;
        continue;
      }
      s.push(lt(p)), r++;
    }
  if (u < r)
    return ["", false, 0, false];
  if (!s.length && !i.length)
    return ["$.", false, n.length - e, true];
  if (i.length === 0 && s.length === 1 && /^\\?.$/.test(s[0]) && !l) {
    let p = s[0].length === 2 ? s[0].slice(-1) : s[0];
    return [Es(p), false, u - e, false];
  }
  let d = "[" + (l ? "^" : "") + we(s) + "]", f = "[" + (l ? "" : "^") + we(i) + "]";
  return [s.length && i.length ? "(" + d + "|" + f + ")" : s.length ? d : f, h, u - e, true];
}, W = (n, { windowsPathsNoEscape: t = false, magicalBraces: e = true } = {}) => e ? t ? n.replace(/\[([^\/\\])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1") : t ? n.replace(/\[([^\/\\{}])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\{}])\]/g, "$1$2").replace(/\\([^\/{}])/g, "$1"), xs, be = (n) => xs.has(n), vs = "(?!(?:^|/)\\.\\.?(?:$|/))", Ct = "(?!\\.)", Cs, Ts, As, ks = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), Kt = "[^/]", Se, Ee, Q = class n {
  type;
  #t;
  #s;
  #n = false;
  #r = [];
  #o;
  #S;
  #w;
  #c = false;
  #h;
  #u;
  #f = false;
  constructor(t, e, s = {}) {
    this.type = t, t && (this.#s = true), this.#o = e, this.#t = this.#o ? this.#o.#t : this, this.#h = this.#t === this ? s : this.#t.#h, this.#w = this.#t === this ? [] : this.#t.#w, t === "!" && !this.#t.#c && this.#w.push(this), this.#S = this.#o ? this.#o.#r.length : 0;
  }
  get hasMagic() {
    if (this.#s !== undefined)
      return this.#s;
    for (let t of this.#r)
      if (typeof t != "string" && (t.type || t.hasMagic))
        return this.#s = true;
    return this.#s;
  }
  toString() {
    return this.#u !== undefined ? this.#u : this.type ? this.#u = this.type + "(" + this.#r.map((t) => String(t)).join("|") + ")" : this.#u = this.#r.map((t) => String(t)).join("");
  }
  #a() {
    if (this !== this.#t)
      throw new Error("should only call on root");
    if (this.#c)
      return this;
    this.toString(), this.#c = true;
    let t;
    for (;t = this.#w.pop(); ) {
      if (t.type !== "!")
        continue;
      let e = t, s = e.#o;
      for (;s; ) {
        for (let i = e.#S + 1;!s.type && i < s.#r.length; i++)
          for (let r of t.#r) {
            if (typeof r == "string")
              throw new Error("string part in extglob AST??");
            r.copyIn(s.#r[i]);
          }
        e = s, s = e.#o;
      }
    }
    return this;
  }
  push(...t) {
    for (let e of t)
      if (e !== "") {
        if (typeof e != "string" && !(e instanceof n && e.#o === this))
          throw new Error("invalid part: " + e);
        this.#r.push(e);
      }
  }
  toJSON() {
    let t = this.type === null ? this.#r.slice().map((e) => typeof e == "string" ? e : e.toJSON()) : [this.type, ...this.#r.map((e) => e.toJSON())];
    return this.isStart() && !this.type && t.unshift([]), this.isEnd() && (this === this.#t || this.#t.#c && this.#o?.type === "!") && t.push({}), t;
  }
  isStart() {
    if (this.#t === this)
      return true;
    if (!this.#o?.isStart())
      return false;
    if (this.#S === 0)
      return true;
    let t = this.#o;
    for (let e = 0;e < this.#S; e++) {
      let s = t.#r[e];
      if (!(s instanceof n && s.type === "!"))
        return false;
    }
    return true;
  }
  isEnd() {
    if (this.#t === this || this.#o?.type === "!")
      return true;
    if (!this.#o?.isEnd())
      return false;
    if (!this.type)
      return this.#o?.isEnd();
    let t = this.#o ? this.#o.#r.length : 0;
    return this.#S === t - 1;
  }
  copyIn(t) {
    typeof t == "string" ? this.push(t) : this.push(t.clone(this));
  }
  clone(t) {
    let e = new n(this.type, t);
    for (let s of this.#r)
      e.copyIn(s);
    return e;
  }
  static #i(t, e, s, i) {
    let r = false, o = false, h = -1, a = false;
    if (e.type === null) {
      let f = s, m = "";
      for (;f < t.length; ) {
        let p = t.charAt(f++);
        if (r || p === "\\") {
          r = !r, m += p;
          continue;
        }
        if (o) {
          f === h + 1 ? (p === "^" || p === "!") && (a = true) : p === "]" && !(f === h + 2 && a) && (o = false), m += p;
          continue;
        } else if (p === "[") {
          o = true, h = f, a = false, m += p;
          continue;
        }
        if (!i.noext && be(p) && t.charAt(f) === "(") {
          e.push(m), m = "";
          let w = new n(p, e);
          f = n.#i(t, w, f, i), e.push(w);
          continue;
        }
        m += p;
      }
      return e.push(m), f;
    }
    let l = s + 1, u = new n(null, e), c = [], d = "";
    for (;l < t.length; ) {
      let f = t.charAt(l++);
      if (r || f === "\\") {
        r = !r, d += f;
        continue;
      }
      if (o) {
        l === h + 1 ? (f === "^" || f === "!") && (a = true) : f === "]" && !(l === h + 2 && a) && (o = false), d += f;
        continue;
      } else if (f === "[") {
        o = true, h = l, a = false, d += f;
        continue;
      }
      if (be(f) && t.charAt(l) === "(") {
        u.push(d), d = "";
        let m = new n(f, u);
        u.push(m), l = n.#i(t, m, l, i);
        continue;
      }
      if (f === "|") {
        u.push(d), d = "", c.push(u), u = new n(null, e);
        continue;
      }
      if (f === ")")
        return d === "" && e.#r.length === 0 && (e.#f = true), u.push(d), d = "", e.push(...c, u), l;
      d += f;
    }
    return e.type = null, e.#s = undefined, e.#r = [t.substring(s - 1)], l;
  }
  static fromGlob(t, e = {}) {
    let s = new n(null, undefined, e);
    return n.#i(t, s, 0, e), s;
  }
  toMMPattern() {
    if (this !== this.#t)
      return this.#t.toMMPattern();
    let t = this.toString(), [e, s, i, r] = this.toRegExpSource();
    if (!(i || this.#s || this.#h.nocase && !this.#h.nocaseMagicOnly && t.toUpperCase() !== t.toLowerCase()))
      return s;
    let h = (this.#h.nocase ? "i" : "") + (r ? "u" : "");
    return Object.assign(new RegExp(`^${e}$`, h), { _src: e, _glob: t });
  }
  get options() {
    return this.#h;
  }
  toRegExpSource(t) {
    let e = t ?? !!this.#h.dot;
    if (this.#t === this && this.#a(), !this.type) {
      let a = this.isStart() && this.isEnd() && !this.#r.some((f) => typeof f != "string"), l = this.#r.map((f) => {
        let [m, p, w, g] = typeof f == "string" ? n.#E(f, this.#s, a) : f.toRegExpSource(t);
        return this.#s = this.#s || w, this.#n = this.#n || g, m;
      }).join(""), u = "";
      if (this.isStart() && typeof this.#r[0] == "string" && !(this.#r.length === 1 && Ts.has(this.#r[0]))) {
        let m = Cs, p = e && m.has(l.charAt(0)) || l.startsWith("\\.") && m.has(l.charAt(2)) || l.startsWith("\\.\\.") && m.has(l.charAt(4)), w = !e && !t && m.has(l.charAt(0));
        u = p ? vs : w ? Ct : "";
      }
      let c = "";
      return this.isEnd() && this.#t.#c && this.#o?.type === "!" && (c = "(?:$|\\/)"), [u + l + c, W(l), this.#s = !!this.#s, this.#n];
    }
    let s = this.type === "*" || this.type === "+", i = this.type === "!" ? "(?:(?!(?:" : "(?:", r = this.#d(e);
    if (this.isStart() && this.isEnd() && !r && this.type !== "!") {
      let a = this.toString();
      return this.#r = [a], this.type = null, this.#s = undefined, [a, W(this.toString()), false, false];
    }
    let o = !s || t || e || !Ct ? "" : this.#d(true);
    o === r && (o = ""), o && (r = `(?:${r})(?:${o})*?`);
    let h = "";
    if (this.type === "!" && this.#f)
      h = (this.isStart() && !e ? Ct : "") + Ee;
    else {
      let a = this.type === "!" ? "))" + (this.isStart() && !e && !t ? Ct : "") + Se + ")" : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && o ? ")" : this.type === "*" && o ? ")?" : `)${this.type}`;
      h = i + r + a;
    }
    return [h, W(r), this.#s = !!this.#s, this.#n];
  }
  #d(t) {
    return this.#r.map((e) => {
      if (typeof e == "string")
        throw new Error("string type in extglob ast??");
      let [s, i, r, o] = e.toRegExpSource(t);
      return this.#n = this.#n || o, s;
    }).filter((e) => !(this.isStart() && this.isEnd()) || !!e).join("|");
  }
  static #E(t, e, s = false) {
    let i = false, r = "", o = false, h = false;
    for (let a = 0;a < t.length; a++) {
      let l = t.charAt(a);
      if (i) {
        i = false, r += (As.has(l) ? "\\" : "") + l;
        continue;
      }
      if (l === "*") {
        if (h)
          continue;
        h = true, r += s && /^[*]+$/.test(t) ? Ee : Se, e = true;
        continue;
      } else
        h = false;
      if (l === "\\") {
        a === t.length - 1 ? r += "\\\\" : i = true;
        continue;
      }
      if (l === "[") {
        let [u, c, d, f] = ye(t, a);
        if (d) {
          r += u, o = o || c, a += d - 1, e = e || f;
          continue;
        }
      }
      if (l === "?") {
        r += Kt, e = true;
        continue;
      }
      r += ks(l);
    }
    return [r, W(t), !!e, o];
  }
}, tt = (n2, { windowsPathsNoEscape: t = false, magicalBraces: e = false } = {}) => e ? t ? n2.replace(/[?*()[\]{}]/g, "[$&]") : n2.replace(/[?*()[\]\\{}]/g, "\\$&") : t ? n2.replace(/[?*()[\]]/g, "[$&]") : n2.replace(/[?*()[\]\\]/g, "\\$&"), O = (n2, t, e = {}) => (at(t), !e.nocomment && t.charAt(0) === "#" ? false : new D(t, e).match(n2)), Rs, Os = (n2) => (t) => !t.startsWith(".") && t.endsWith(n2), Fs = (n2) => (t) => t.endsWith(n2), Ds = (n2) => (n2 = n2.toLowerCase(), (t) => !t.startsWith(".") && t.toLowerCase().endsWith(n2)), Ms = (n2) => (n2 = n2.toLowerCase(), (t) => t.toLowerCase().endsWith(n2)), Ns, _s = (n2) => !n2.startsWith(".") && n2.includes("."), Ls = (n2) => n2 !== "." && n2 !== ".." && n2.includes("."), Ws, Ps = (n2) => n2 !== "." && n2 !== ".." && n2.startsWith("."), js, Is = (n2) => n2.length !== 0 && !n2.startsWith("."), zs = (n2) => n2.length !== 0 && n2 !== "." && n2 !== "..", Bs, Us = ([n2, t = ""]) => {
  let e = Ce([n2]);
  return t ? (t = t.toLowerCase(), (s) => e(s) && s.toLowerCase().endsWith(t)) : e;
}, $s = ([n2, t = ""]) => {
  let e = Te([n2]);
  return t ? (t = t.toLowerCase(), (s) => e(s) && s.toLowerCase().endsWith(t)) : e;
}, Gs = ([n2, t = ""]) => {
  let e = Te([n2]);
  return t ? (s) => e(s) && s.endsWith(t) : e;
}, Hs = ([n2, t = ""]) => {
  let e = Ce([n2]);
  return t ? (s) => e(s) && s.endsWith(t) : e;
}, Ce = ([n2]) => {
  let t = n2.length;
  return (e) => e.length === t && !e.startsWith(".");
}, Te = ([n2]) => {
  let t = n2.length;
  return (e) => e.length === t && e !== "." && e !== "..";
}, Ae, xe, qs, A, Ks = "[^/]", Vs, Ys = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?", Xs = "(?:(?!(?:\\/|^)\\.).)*?", Js = (n2, t = {}) => (e) => O(e, n2, t), N = (n2, t = {}) => Object.assign({}, n2, t), Zs = (n2) => {
  if (!n2 || typeof n2 != "object" || !Object.keys(n2).length)
    return O;
  let t = O;
  return Object.assign((s, i, r = {}) => t(s, i, N(n2, r)), { Minimatch: class extends t.Minimatch {
    constructor(i, r = {}) {
      super(i, N(n2, r));
    }
    static defaults(i) {
      return t.defaults(N(n2, i)).Minimatch;
    }
  }, AST: class extends t.AST {
    constructor(i, r, o = {}) {
      super(i, r, N(n2, o));
    }
    static fromGlob(i, r = {}) {
      return t.AST.fromGlob(i, N(n2, r));
    }
  }, unescape: (s, i = {}) => t.unescape(s, N(n2, i)), escape: (s, i = {}) => t.escape(s, N(n2, i)), filter: (s, i = {}) => t.filter(s, N(n2, i)), defaults: (s) => t.defaults(N(n2, s)), makeRe: (s, i = {}) => t.makeRe(s, N(n2, i)), braceExpand: (s, i = {}) => t.braceExpand(s, N(n2, i)), match: (s, i, r = {}) => t.match(s, i, N(n2, r)), sep: t.sep, GLOBSTAR: A });
}, ke = (n2, t = {}) => (at(n2), t.nobrace || !/\{(?:(?!\{).)*\}/.test(n2) ? [n2] : ge(n2, { max: t.braceExpandMax })), Qs = (n2, t = {}) => new D(n2, t).makeRe(), ti = (n2, t, e = {}) => {
  let s = new D(t, e);
  return n2 = n2.filter((i) => s.match(i)), s.options.nonull && !n2.length && n2.push(t), n2;
}, ve, ei = (n2) => n2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), D = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  regexp;
  constructor(t, e = {}) {
    at(t), e = e || {}, this.options = e, this.pattern = t, this.platform = e.platform || Ae, this.isWindows = this.platform === "win32";
    let s = "allowWindowsEscape";
    this.windowsPathsNoEscape = !!e.windowsPathsNoEscape || e[s] === false, this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, "/")), this.preserveMultipleSlashes = !!e.preserveMultipleSlashes, this.regexp = null, this.negate = false, this.nonegate = !!e.nonegate, this.comment = false, this.empty = false, this.partial = !!e.partial, this.nocase = !!this.options.nocase, this.windowsNoMagicRoot = e.windowsNoMagicRoot !== undefined ? e.windowsNoMagicRoot : !!(this.isWindows && this.nocase), this.globSet = [], this.globParts = [], this.set = [], this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1)
      return true;
    for (let t of this.set)
      for (let e of t)
        if (typeof e != "string")
          return true;
    return false;
  }
  debug(...t) {}
  make() {
    let t = this.pattern, e = this.options;
    if (!e.nocomment && t.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!t) {
      this.empty = true;
      return;
    }
    this.parseNegate(), this.globSet = [...new Set(this.braceExpand())], e.debug && (this.debug = (...r) => console.error(...r)), this.debug(this.pattern, this.globSet);
    let s = this.globSet.map((r) => this.slashSplit(r));
    this.globParts = this.preprocess(s), this.debug(this.pattern, this.globParts);
    let i = this.globParts.map((r, o, h) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        let a = r[0] === "" && r[1] === "" && (r[2] === "?" || !ve.test(r[2])) && !ve.test(r[3]), l = /^[a-z]:/i.test(r[0]);
        if (a)
          return [...r.slice(0, 4), ...r.slice(4).map((u) => this.parse(u))];
        if (l)
          return [r[0], ...r.slice(1).map((u) => this.parse(u))];
      }
      return r.map((a) => this.parse(a));
    });
    if (this.debug(this.pattern, i), this.set = i.filter((r) => r.indexOf(false) === -1), this.isWindows)
      for (let r = 0;r < this.set.length; r++) {
        let o = this.set[r];
        o[0] === "" && o[1] === "" && this.globParts[r][2] === "?" && typeof o[3] == "string" && /^[a-z]:$/i.test(o[3]) && (o[2] = "?");
      }
    this.debug(this.pattern, this.set);
  }
  preprocess(t) {
    if (this.options.noglobstar)
      for (let s = 0;s < t.length; s++)
        for (let i = 0;i < t[s].length; i++)
          t[s][i] === "**" && (t[s][i] = "*");
    let { optimizationLevel: e = 1 } = this.options;
    return e >= 2 ? (t = this.firstPhasePreProcess(t), t = this.secondPhasePreProcess(t)) : e >= 1 ? t = this.levelOneOptimize(t) : t = this.adjascentGlobstarOptimize(t), t;
  }
  adjascentGlobstarOptimize(t) {
    return t.map((e) => {
      let s = -1;
      for (;(s = e.indexOf("**", s + 1)) !== -1; ) {
        let i = s;
        for (;e[i + 1] === "**"; )
          i++;
        i !== s && e.splice(s, i - s);
      }
      return e;
    });
  }
  levelOneOptimize(t) {
    return t.map((e) => (e = e.reduce((s, i) => {
      let r = s[s.length - 1];
      return i === "**" && r === "**" ? s : i === ".." && r && r !== ".." && r !== "." && r !== "**" ? (s.pop(), s) : (s.push(i), s);
    }, []), e.length === 0 ? [""] : e));
  }
  levelTwoFileOptimize(t) {
    Array.isArray(t) || (t = this.slashSplit(t));
    let e = false;
    do {
      if (e = false, !this.preserveMultipleSlashes) {
        for (let i = 1;i < t.length - 1; i++) {
          let r = t[i];
          i === 1 && r === "" && t[0] === "" || (r === "." || r === "") && (e = true, t.splice(i, 1), i--);
        }
        t[0] === "." && t.length === 2 && (t[1] === "." || t[1] === "") && (e = true, t.pop());
      }
      let s = 0;
      for (;(s = t.indexOf("..", s + 1)) !== -1; ) {
        let i = t[s - 1];
        i && i !== "." && i !== ".." && i !== "**" && (e = true, t.splice(s - 1, 2), s -= 2);
      }
    } while (e);
    return t.length === 0 ? [""] : t;
  }
  firstPhasePreProcess(t) {
    let e = false;
    do {
      e = false;
      for (let s of t) {
        let i = -1;
        for (;(i = s.indexOf("**", i + 1)) !== -1; ) {
          let o = i;
          for (;s[o + 1] === "**"; )
            o++;
          o > i && s.splice(i + 1, o - i);
          let h = s[i + 1], a = s[i + 2], l = s[i + 3];
          if (h !== ".." || !a || a === "." || a === ".." || !l || l === "." || l === "..")
            continue;
          e = true, s.splice(i, 1);
          let u = s.slice(0);
          u[i] = "**", t.push(u), i--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let o = 1;o < s.length - 1; o++) {
            let h = s[o];
            o === 1 && h === "" && s[0] === "" || (h === "." || h === "") && (e = true, s.splice(o, 1), o--);
          }
          s[0] === "." && s.length === 2 && (s[1] === "." || s[1] === "") && (e = true, s.pop());
        }
        let r = 0;
        for (;(r = s.indexOf("..", r + 1)) !== -1; ) {
          let o = s[r - 1];
          if (o && o !== "." && o !== ".." && o !== "**") {
            e = true;
            let a = r === 1 && s[r + 1] === "**" ? ["."] : [];
            s.splice(r - 1, 2, ...a), s.length === 0 && s.push(""), r -= 2;
          }
        }
      }
    } while (e);
    return t;
  }
  secondPhasePreProcess(t) {
    for (let e = 0;e < t.length - 1; e++)
      for (let s = e + 1;s < t.length; s++) {
        let i = this.partsMatch(t[e], t[s], !this.preserveMultipleSlashes);
        if (i) {
          t[e] = [], t[s] = i;
          break;
        }
      }
    return t.filter((e) => e.length);
  }
  partsMatch(t, e, s = false) {
    let i = 0, r = 0, o = [], h = "";
    for (;i < t.length && r < e.length; )
      if (t[i] === e[r])
        o.push(h === "b" ? e[r] : t[i]), i++, r++;
      else if (s && t[i] === "**" && e[r] === t[i + 1])
        o.push(t[i]), i++;
      else if (s && e[r] === "**" && t[i] === e[r + 1])
        o.push(e[r]), r++;
      else if (t[i] === "*" && e[r] && (this.options.dot || !e[r].startsWith(".")) && e[r] !== "**") {
        if (h === "b")
          return false;
        h = "a", o.push(t[i]), i++, r++;
      } else if (e[r] === "*" && t[i] && (this.options.dot || !t[i].startsWith(".")) && t[i] !== "**") {
        if (h === "a")
          return false;
        h = "b", o.push(e[r]), i++, r++;
      } else
        return false;
    return t.length === e.length && o;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    let t = this.pattern, e = false, s = 0;
    for (let i = 0;i < t.length && t.charAt(i) === "!"; i++)
      e = !e, s++;
    s && (this.pattern = t.slice(s)), this.negate = e;
  }
  matchOne(t, e, s = false) {
    let i = this.options;
    if (this.isWindows) {
      let p = typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]), w = !p && t[0] === "" && t[1] === "" && t[2] === "?" && /^[a-z]:$/i.test(t[3]), g = typeof e[0] == "string" && /^[a-z]:$/i.test(e[0]), S = !g && e[0] === "" && e[1] === "" && e[2] === "?" && typeof e[3] == "string" && /^[a-z]:$/i.test(e[3]), E = w ? 3 : p ? 0 : undefined, y = S ? 3 : g ? 0 : undefined;
      if (typeof E == "number" && typeof y == "number") {
        let [b, z] = [t[E], e[y]];
        b.toLowerCase() === z.toLowerCase() && (e[y] = b, y > E ? e = e.slice(y) : E > y && (t = t.slice(E)));
      }
    }
    let { optimizationLevel: r = 1 } = this.options;
    r >= 2 && (t = this.levelTwoFileOptimize(t)), this.debug("matchOne", this, { file: t, pattern: e }), this.debug("matchOne", t.length, e.length);
    for (var o = 0, h = 0, a = t.length, l = e.length;o < a && h < l; o++, h++) {
      this.debug("matchOne loop");
      var u = e[h], c = t[o];
      if (this.debug(e, u, c), u === false)
        return false;
      if (u === A) {
        this.debug("GLOBSTAR", [e, u, c]);
        var d = o, f = h + 1;
        if (f === l) {
          for (this.debug("** at the end");o < a; o++)
            if (t[o] === "." || t[o] === ".." || !i.dot && t[o].charAt(0) === ".")
              return false;
          return true;
        }
        for (;d < a; ) {
          var m = t[d];
          if (this.debug(`
globstar while`, t, d, e, f, m), this.matchOne(t.slice(d), e.slice(f), s))
            return this.debug("globstar found match!", d, a, m), true;
          if (m === "." || m === ".." || !i.dot && m.charAt(0) === ".") {
            this.debug("dot detected!", t, d, e, f);
            break;
          }
          this.debug("globstar swallow a segment, and continue"), d++;
        }
        return !!(s && (this.debug(`
>>> no match, partial?`, t, d, e, f), d === a));
      }
      let p;
      if (typeof u == "string" ? (p = c === u, this.debug("string match", u, c, p)) : (p = u.test(c), this.debug("pattern match", u, c, p)), !p)
        return false;
    }
    if (o === a && h === l)
      return true;
    if (o === a)
      return s;
    if (h === l)
      return o === a - 1 && t[o] === "";
    throw new Error("wtf?");
  }
  braceExpand() {
    return ke(this.pattern, this.options);
  }
  parse(t) {
    at(t);
    let e = this.options;
    if (t === "**")
      return A;
    if (t === "")
      return "";
    let s, i = null;
    (s = t.match(js)) ? i = e.dot ? zs : Is : (s = t.match(Rs)) ? i = (e.nocase ? e.dot ? Ms : Ds : e.dot ? Fs : Os)(s[1]) : (s = t.match(Bs)) ? i = (e.nocase ? e.dot ? $s : Us : e.dot ? Gs : Hs)(s) : (s = t.match(Ns)) ? i = e.dot ? Ls : _s : (s = t.match(Ws)) && (i = Ps);
    let r = Q.fromGlob(t, this.options).toMMPattern();
    return i && typeof r == "object" && Reflect.defineProperty(r, "test", { value: i }), r;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    let t = this.set;
    if (!t.length)
      return this.regexp = false, this.regexp;
    let e = this.options, s = e.noglobstar ? Vs : e.dot ? Ys : Xs, i = new Set(e.nocase ? ["i"] : []), r = t.map((a) => {
      let l = a.map((c) => {
        if (c instanceof RegExp)
          for (let d of c.flags.split(""))
            i.add(d);
        return typeof c == "string" ? ei(c) : c === A ? A : c._src;
      });
      l.forEach((c, d) => {
        let f = l[d + 1], m = l[d - 1];
        c !== A || m === A || (m === undefined ? f !== undefined && f !== A ? l[d + 1] = "(?:\\/|" + s + "\\/)?" + f : l[d] = s : f === undefined ? l[d - 1] = m + "(?:\\/|\\/" + s + ")?" : f !== A && (l[d - 1] = m + "(?:\\/|\\/" + s + "\\/)" + f, l[d + 1] = A));
      });
      let u = l.filter((c) => c !== A);
      if (this.partial && u.length >= 1) {
        let c = [];
        for (let d = 1;d <= u.length; d++)
          c.push(u.slice(0, d).join("/"));
        return "(?:" + c.join("|") + ")";
      }
      return u.join("/");
    }).join("|"), [o, h] = t.length > 1 ? ["(?:", ")"] : ["", ""];
    r = "^" + o + r + h + "$", this.partial && (r = "^(?:\\/|" + o + r.slice(1, -1) + h + ")$"), this.negate && (r = "^(?!" + r + ").+$");
    try {
      this.regexp = new RegExp(r, [...i].join(""));
    } catch {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(t) {
    return this.preserveMultipleSlashes ? t.split("/") : this.isWindows && /^\/\/[^\/]+/.test(t) ? ["", ...t.split(/\/+/)] : t.split(/\/+/);
  }
  match(t, e = this.partial) {
    if (this.debug("match", t, this.pattern), this.comment)
      return false;
    if (this.empty)
      return t === "";
    if (t === "/" && e)
      return true;
    let s = this.options;
    this.isWindows && (t = t.split("\\").join("/"));
    let i = this.slashSplit(t);
    this.debug(this.pattern, "split", i);
    let r = this.set;
    this.debug(this.pattern, "set", r);
    let o = i[i.length - 1];
    if (!o)
      for (let h = i.length - 2;!o && h >= 0; h--)
        o = i[h];
    for (let h = 0;h < r.length; h++) {
      let a = r[h], l = i;
      if (s.matchBase && a.length === 1 && (l = [o]), this.matchOne(l, a, e))
        return s.flipNegate ? true : !this.negate;
    }
    return s.flipNegate ? false : this.negate;
  }
  static defaults(t) {
    return O.defaults(t).Minimatch;
  }
}, si, Oe, Vt, Fe = (n2, t, e, s) => {
  typeof Vt.emitWarning == "function" ? Vt.emitWarning(n2, t, e, s) : console.error(`[${e}] ${t}: ${n2}`);
}, At, Re, ii = (n2) => !Oe.has(n2), q = (n2) => n2 && n2 === Math.floor(n2) && n2 > 0 && isFinite(n2), De = (n2) => q(n2) ? n2 <= Math.pow(2, 8) ? Uint8Array : n2 <= Math.pow(2, 16) ? Uint16Array : n2 <= Math.pow(2, 32) ? Uint32Array : n2 <= Number.MAX_SAFE_INTEGER ? Tt : null : null, Tt, ri = class ct {
  heap;
  length;
  static #t = false;
  static create(t) {
    let e = De(t);
    if (!e)
      return [];
    ct.#t = true;
    let s = new ct(t, e);
    return ct.#t = false, s;
  }
  constructor(t, e) {
    if (!ct.#t)
      throw new TypeError("instantiate Stack using Stack.create(n)");
    this.heap = new e(t), this.length = 0;
  }
  push(t) {
    this.heap[this.length++] = t;
  }
  pop() {
    return this.heap[--this.length];
  }
}, ft, Ne, oi = (n2) => !!n2 && typeof n2 == "object" && (n2 instanceof V || n2 instanceof Pe || hi(n2) || ai(n2)), hi = (n2) => !!n2 && typeof n2 == "object" && n2 instanceof ee && typeof n2.pipe == "function" && n2.pipe !== Pe.Writable.prototype.pipe, ai = (n2) => !!n2 && typeof n2 == "object" && n2 instanceof ee && typeof n2.write == "function" && typeof n2.end == "function", G, H, K, kt, ut, Rt, _e, Ot, Le, P, et, v, dt, st, C, F, T, Yt, Ft, k, x, Xt, Jt, We, Zt, B, Qt, Dt, pt, Y, M, mt = (n2) => Promise.resolve().then(n2), li = (n2) => n2(), ci = (n2) => n2 === "end" || n2 === "finish" || n2 === "prefinish", fi = (n2) => n2 instanceof ArrayBuffer || !!n2 && typeof n2 == "object" && n2.constructor && n2.constructor.name === "ArrayBuffer" && n2.byteLength >= 0, ui = (n2) => !Buffer.isBuffer(n2) && ArrayBuffer.isView(n2), Mt = class {
  src;
  dest;
  opts;
  ondrain;
  constructor(t, e, s) {
    this.src = t, this.dest = e, this.opts = s, this.ondrain = () => t[st](), this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  proxyErrors(t) {}
  end() {
    this.unpipe(), this.opts.end && this.dest.end();
  }
}, te, di = (n2) => !!n2.objectMode, pi = (n2) => !n2.objectMode && !!n2.encoding && n2.encoding !== "buffer", V, vi, wt, Ue = (n2) => !n2 || n2 === wt || n2 === xi ? wt : { ...wt, ...n2, promises: { ...wt.promises, ...n2.promises || {} } }, $e, Ri = (n2) => n2.replace(/\//g, "\\").replace($e, "$1\\"), Oi, L = 0, Ge = 1, He = 2, U = 4, qe = 6, Ke = 8, X = 10, Ve = 12, _ = 15, gt, se = 16, je = 32, yt = 64, j = 128, Nt = 256, Lt = 512, Ie, Fi = 1023, ie = (n2) => n2.isFile() ? Ke : n2.isDirectory() ? U : n2.isSymbolicLink() ? X : n2.isCharacterDevice() ? He : n2.isBlockDevice() ? qe : n2.isSocket() ? Ve : n2.isFIFO() ? Ge : L, ze, bt = (n2) => {
  let t = ze.get(n2);
  if (t)
    return t;
  let e = n2.normalize("NFKD");
  return ze.set(n2, e), e;
}, Be, _t = (n2) => {
  let t = Be.get(n2);
  if (t)
    return t;
  let e = bt(n2.toLowerCase());
  return Be.set(n2, e), e;
}, Wt, ne, Ye, R, Pt, jt, It, it, rt, St, Cr, Xe, Di = (n4) => n4.length >= 1, Mi = (n4) => n4.length >= 1, Ni, nt, _i, ot = class {
  relative;
  relativeChildren;
  absolute;
  absoluteChildren;
  platform;
  mmopts;
  constructor(t, { nobrace: e, nocase: s, noext: i, noglobstar: r, platform: o = _i }) {
    this.relative = [], this.absolute = [], this.relativeChildren = [], this.absoluteChildren = [], this.platform = o, this.mmopts = { dot: true, nobrace: e, nocase: s, noext: i, noglobstar: r, optimizationLevel: 2, platform: o, nocomment: true, nonegate: true };
    for (let h of t)
      this.add(h);
  }
  add(t) {
    let e = new D(t, this.mmopts);
    for (let s = 0;s < e.set.length; s++) {
      let i = e.set[s], r = e.globParts[s];
      if (!i || !r)
        throw new Error("invalid pattern object");
      for (;i[0] === "." && r[0] === "."; )
        i.shift(), r.shift();
      let o = new nt(i, r, 0, this.platform), h = new D(o.globString(), this.mmopts), a = r[r.length - 1] === "**", l = o.isAbsolute();
      l ? this.absolute.push(h) : this.relative.push(h), a && (l ? this.absoluteChildren.push(h) : this.relativeChildren.push(h));
    }
  }
  ignored(t) {
    let e = t.fullpath(), s = `${e}/`, i = t.relative() || ".", r = `${i}/`;
    for (let o of this.relative)
      if (o.match(i) || o.match(r))
        return true;
    for (let o of this.absolute)
      if (o.match(e) || o.match(s))
        return true;
    return false;
  }
  childrenIgnored(t) {
    let e = t.fullpath() + "/", s = (t.relative() || ".") + "/";
    for (let i of this.relativeChildren)
      if (i.match(s))
        return true;
    for (let i of this.absoluteChildren)
      if (i.match(e))
        return true;
    return false;
  }
}, oe = class n5 {
  store;
  constructor(t = new Map) {
    this.store = t;
  }
  copy() {
    return new n5(new Map(this.store));
  }
  hasWalked(t, e) {
    return this.store.get(t.fullpath())?.has(e.globString());
  }
  storeWalked(t, e) {
    let s = t.fullpath(), i = this.store.get(s);
    i ? i.add(e.globString()) : this.store.set(s, new Set([e.globString()]));
  }
}, he = class {
  store = new Map;
  add(t, e, s) {
    let i = (e ? 2 : 0) | (s ? 1 : 0), r = this.store.get(t);
    this.store.set(t, r === undefined ? i : i & r);
  }
  entries() {
    return [...this.store.entries()].map(([t, e]) => [t, !!(e & 2), !!(e & 1)]);
  }
}, ae = class {
  store = new Map;
  add(t, e) {
    if (!t.canReaddir())
      return;
    let s = this.store.get(t);
    s ? s.find((i) => i.globString() === e.globString()) || s.push(e) : this.store.set(t, [e]);
  }
  get(t) {
    let e = this.store.get(t);
    if (!e)
      throw new Error("attempting to walk unknown path");
    return e;
  }
  entries() {
    return this.keys().map((t) => [t, this.store.get(t)]);
  }
  keys() {
    return [...this.store.keys()].filter((t) => t.canReaddir());
  }
}, Et = class n6 {
  hasWalkedCache;
  matches = new he;
  subwalks = new ae;
  patterns;
  follow;
  dot;
  opts;
  constructor(t, e) {
    this.opts = t, this.follow = !!t.follow, this.dot = !!t.dot, this.hasWalkedCache = e ? e.copy() : new oe;
  }
  processPatterns(t, e) {
    this.patterns = e;
    let s = e.map((i) => [t, i]);
    for (let [i, r] of s) {
      this.hasWalkedCache.storeWalked(i, r);
      let o = r.root(), h = r.isAbsolute() && this.opts.absolute !== false;
      if (o) {
        i = i.resolve(o === "/" && this.opts.root !== undefined ? this.opts.root : o);
        let c = r.rest();
        if (c)
          r = c;
        else {
          this.matches.add(i, true, false);
          continue;
        }
      }
      if (i.isENOENT())
        continue;
      let a, l, u = false;
      for (;typeof (a = r.pattern()) == "string" && (l = r.rest()); )
        i = i.resolve(a), r = l, u = true;
      if (a = r.pattern(), l = r.rest(), u) {
        if (this.hasWalkedCache.hasWalked(i, r))
          continue;
        this.hasWalkedCache.storeWalked(i, r);
      }
      if (typeof a == "string") {
        let c = a === ".." || a === "" || a === ".";
        this.matches.add(i.resolve(a), h, c);
        continue;
      } else if (a === A) {
        (!i.isSymbolicLink() || this.follow || r.checkFollowGlobstar()) && this.subwalks.add(i, r);
        let c = l?.pattern(), d = l?.rest();
        if (!l || (c === "" || c === ".") && !d)
          this.matches.add(i, h, c === "" || c === ".");
        else if (c === "..") {
          let f = i.parent || i;
          d ? this.hasWalkedCache.hasWalked(f, d) || this.subwalks.add(f, d) : this.matches.add(f, h, true);
        }
      } else
        a instanceof RegExp && this.subwalks.add(i, r);
    }
    return this;
  }
  subwalkTargets() {
    return this.subwalks.keys();
  }
  child() {
    return new n6(this.opts, this.hasWalkedCache);
  }
  filterEntries(t, e) {
    let s = this.subwalks.get(t), i = this.child();
    for (let r of e)
      for (let o of s) {
        let h = o.isAbsolute(), a = o.pattern(), l = o.rest();
        a === A ? i.testGlobstar(r, o, l, h) : a instanceof RegExp ? i.testRegExp(r, a, l, h) : i.testString(r, a, l, h);
      }
    return i;
  }
  testGlobstar(t, e, s, i) {
    if ((this.dot || !t.name.startsWith(".")) && (e.hasMore() || this.matches.add(t, i, false), t.canReaddir() && (this.follow || !t.isSymbolicLink() ? this.subwalks.add(t, e) : t.isSymbolicLink() && (s && e.checkFollowGlobstar() ? this.subwalks.add(t, s) : e.markFollowGlobstar() && this.subwalks.add(t, e)))), s) {
      let r = s.pattern();
      if (typeof r == "string" && r !== ".." && r !== "" && r !== ".")
        this.testString(t, r, s.rest(), i);
      else if (r === "..") {
        let o = t.parent || t;
        this.subwalks.add(o, s);
      } else
        r instanceof RegExp && this.testRegExp(t, r, s.rest(), i);
    }
  }
  testRegExp(t, e, s, i) {
    e.test(t.name) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, false));
  }
  testString(t, e, s, i) {
    t.isNamed(e) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, false));
  }
}, Li = (n7, t) => typeof n7 == "string" ? new ot([n7], t) : Array.isArray(n7) ? new ot(n7, t) : n7, zt = class {
  path;
  patterns;
  opts;
  seen = new Set;
  paused = false;
  aborted = false;
  #t = [];
  #s;
  #n;
  signal;
  maxDepth;
  includeChildMatches;
  constructor(t, e, s) {
    if (this.patterns = t, this.path = e, this.opts = s, this.#n = !s.posix && s.platform === "win32" ? "\\" : "/", this.includeChildMatches = s.includeChildMatches !== false, (s.ignore || !this.includeChildMatches) && (this.#s = Li(s.ignore ?? [], s), !this.includeChildMatches && typeof this.#s.add != "function")) {
      let i = "cannot ignore child matches, ignore lacks add() method.";
      throw new Error(i);
    }
    this.maxDepth = s.maxDepth || 1 / 0, s.signal && (this.signal = s.signal, this.signal.addEventListener("abort", () => {
      this.#t.length = 0;
    }));
  }
  #r(t) {
    return this.seen.has(t) || !!this.#s?.ignored?.(t);
  }
  #o(t) {
    return !!this.#s?.childrenIgnored?.(t);
  }
  pause() {
    this.paused = true;
  }
  resume() {
    if (this.signal?.aborted)
      return;
    this.paused = false;
    let t;
    for (;!this.paused && (t = this.#t.shift()); )
      t();
  }
  onResume(t) {
    this.signal?.aborted || (this.paused ? this.#t.push(t) : t());
  }
  async matchCheck(t, e) {
    if (e && this.opts.nodir)
      return;
    let s;
    if (this.opts.realpath) {
      if (s = t.realpathCached() || await t.realpath(), !s)
        return;
      t = s;
    }
    let r = t.isUnknown() || this.opts.stat ? await t.lstat() : t;
    if (this.opts.follow && this.opts.nodir && r?.isSymbolicLink()) {
      let o = await r.realpath();
      o && (o.isUnknown() || this.opts.stat) && await o.lstat();
    }
    return this.matchCheckTest(r, e);
  }
  matchCheckTest(t, e) {
    return t && (this.maxDepth === 1 / 0 || t.depth() <= this.maxDepth) && (!e || t.canReaddir()) && (!this.opts.nodir || !t.isDirectory()) && (!this.opts.nodir || !this.opts.follow || !t.isSymbolicLink() || !t.realpathCached()?.isDirectory()) && !this.#r(t) ? t : undefined;
  }
  matchCheckSync(t, e) {
    if (e && this.opts.nodir)
      return;
    let s;
    if (this.opts.realpath) {
      if (s = t.realpathCached() || t.realpathSync(), !s)
        return;
      t = s;
    }
    let r = t.isUnknown() || this.opts.stat ? t.lstatSync() : t;
    if (this.opts.follow && this.opts.nodir && r?.isSymbolicLink()) {
      let o = r.realpathSync();
      o && (o?.isUnknown() || this.opts.stat) && o.lstatSync();
    }
    return this.matchCheckTest(r, e);
  }
  matchFinish(t, e) {
    if (this.#r(t))
      return;
    if (!this.includeChildMatches && this.#s?.add) {
      let r = `${t.relativePosix()}/**`;
      this.#s.add(r);
    }
    let s = this.opts.absolute === undefined ? e : this.opts.absolute;
    this.seen.add(t);
    let i = this.opts.mark && t.isDirectory() ? this.#n : "";
    if (this.opts.withFileTypes)
      this.matchEmit(t);
    else if (s) {
      let r = this.opts.posix ? t.fullpathPosix() : t.fullpath();
      this.matchEmit(r + i);
    } else {
      let r = this.opts.posix ? t.relativePosix() : t.relative(), o = this.opts.dotRelative && !r.startsWith(".." + this.#n) ? "." + this.#n : "";
      this.matchEmit(r ? o + r + i : "." + i);
    }
  }
  async match(t, e, s) {
    let i = await this.matchCheck(t, s);
    i && this.matchFinish(i, e);
  }
  matchSync(t, e, s) {
    let i = this.matchCheckSync(t, s);
    i && this.matchFinish(i, e);
  }
  walkCB(t, e, s) {
    this.signal?.aborted && s(), this.walkCB2(t, e, new Et(this.opts), s);
  }
  walkCB2(t, e, s, i) {
    if (this.#o(t))
      return i();
    if (this.signal?.aborted && i(), this.paused) {
      this.onResume(() => this.walkCB2(t, e, s, i));
      return;
    }
    s.processPatterns(t, e);
    let r = 1, o = () => {
      --r === 0 && i();
    };
    for (let [h, a, l] of s.matches.entries())
      this.#r(h) || (r++, this.match(h, a, l).then(() => o()));
    for (let h of s.subwalkTargets()) {
      if (this.maxDepth !== 1 / 0 && h.depth() >= this.maxDepth)
        continue;
      r++;
      let a = h.readdirCached();
      h.calledReaddir() ? this.walkCB3(h, a, s, o) : h.readdirCB((l, u) => this.walkCB3(h, u, s, o), true);
    }
    o();
  }
  walkCB3(t, e, s, i) {
    s = s.filterEntries(t, e);
    let r = 1, o = () => {
      --r === 0 && i();
    };
    for (let [h, a, l] of s.matches.entries())
      this.#r(h) || (r++, this.match(h, a, l).then(() => o()));
    for (let [h, a] of s.subwalks.entries())
      r++, this.walkCB2(h, a, s.child(), o);
    o();
  }
  walkCBSync(t, e, s) {
    this.signal?.aborted && s(), this.walkCB2Sync(t, e, new Et(this.opts), s);
  }
  walkCB2Sync(t, e, s, i) {
    if (this.#o(t))
      return i();
    if (this.signal?.aborted && i(), this.paused) {
      this.onResume(() => this.walkCB2Sync(t, e, s, i));
      return;
    }
    s.processPatterns(t, e);
    let r = 1, o = () => {
      --r === 0 && i();
    };
    for (let [h, a, l] of s.matches.entries())
      this.#r(h) || this.matchSync(h, a, l);
    for (let h of s.subwalkTargets()) {
      if (this.maxDepth !== 1 / 0 && h.depth() >= this.maxDepth)
        continue;
      r++;
      let a = h.readdirSync();
      this.walkCB3Sync(h, a, s, o);
    }
    o();
  }
  walkCB3Sync(t, e, s, i) {
    s = s.filterEntries(t, e);
    let r = 1, o = () => {
      --r === 0 && i();
    };
    for (let [h, a, l] of s.matches.entries())
      this.#r(h) || this.matchSync(h, a, l);
    for (let [h, a] of s.subwalks.entries())
      r++, this.walkCB2Sync(h, a, s.child(), o);
    o();
  }
}, xt, vt, Pi, I, le = (n7, t = {}) => {
  Array.isArray(n7) || (n7 = [n7]);
  for (let e of n7)
    if (new D(e, t).hasMagic())
      return true;
  return false;
}, ji, Ii, zi, Bi, Ui, Ze;
var init_index_min = __esm(() => {
  fe = "\x00SLASH" + Math.random() + "\x00";
  ue = "\x00OPEN" + Math.random() + "\x00";
  qt = "\x00CLOSE" + Math.random() + "\x00";
  de = "\x00COMMA" + Math.random() + "\x00";
  pe = "\x00PERIOD" + Math.random() + "\x00";
  is = new RegExp(fe, "g");
  rs = new RegExp(ue, "g");
  ns = new RegExp(qt, "g");
  os = new RegExp(de, "g");
  hs = new RegExp(pe, "g");
  as = /\\\\/g;
  ls = /\\{/g;
  cs = /\\}/g;
  fs7 = /\\,/g;
  us = /\\./g;
  Ss = { "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true], "[:alpha:]": ["\\p{L}\\p{Nl}", true], "[:ascii:]": ["\\x00-\\x7f", false], "[:blank:]": ["\\p{Zs}\\t", true], "[:cntrl:]": ["\\p{Cc}", true], "[:digit:]": ["\\p{Nd}", true], "[:graph:]": ["\\p{Z}\\p{C}", true, true], "[:lower:]": ["\\p{Ll}", true], "[:print:]": ["\\p{C}", true], "[:punct:]": ["\\p{P}", true], "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true], "[:upper:]": ["\\p{Lu}", true], "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true], "[:xdigit:]": ["A-Fa-f0-9", false] };
  xs = new Set(["!", "?", "+", "*", "@"]);
  Cs = new Set(["[", "."]);
  Ts = new Set(["..", "."]);
  As = new Set("().*{}+?[]^$\\!");
  Se = Kt + "*?";
  Ee = Kt + "+?";
  Rs = /^\*+([^+@!?\*\[\(]*)$/;
  Ns = /^\*+\.\*+$/;
  Ws = /^\.\*+$/;
  js = /^\*+$/;
  Bs = /^\?+([^+@!?\*\[\(]*)?$/;
  Ae = typeof process == "object" && process ? typeof process.env == "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
  xe = { win32: { sep: "\\" }, posix: { sep: "/" } };
  qs = Ae === "win32" ? xe.win32.sep : xe.posix.sep;
  O.sep = qs;
  A = Symbol("globstar **");
  O.GLOBSTAR = A;
  Vs = Ks + "*?";
  O.filter = Js;
  O.defaults = Zs;
  O.braceExpand = ke;
  O.makeRe = Qs;
  O.match = ti;
  ve = /[?*]|[+@!]\(.*?\)|\[|\]/;
  O.AST = Q;
  O.Minimatch = D;
  O.escape = tt;
  O.unescape = W;
  si = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date;
  Oe = new Set;
  Vt = typeof process == "object" && process ? process : {};
  At = globalThis.AbortController;
  Re = globalThis.AbortSignal;
  if (typeof At > "u") {
    Re = class {
      onabort;
      _onabort = [];
      reason;
      aborted = false;
      addEventListener(e, s) {
        this._onabort.push(s);
      }
    }, At = class {
      constructor() {
        t();
      }
      signal = new Re;
      abort(e) {
        if (!this.signal.aborted) {
          this.signal.reason = e, this.signal.aborted = true;
          for (let s of this.signal._onabort)
            s(e);
          this.signal.onabort?.(e);
        }
      }
    };
    let n2 = Vt.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1", t = () => {
      n2 && (n2 = false, Fe("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", t));
    };
  }
  Tt = class extends Array {
    constructor(n2) {
      super(n2), this.fill(0);
    }
  };
  ft = class Me {
    #t;
    #s;
    #n;
    #r;
    #o;
    #S;
    #w;
    #c;
    get perf() {
      return this.#c;
    }
    ttl;
    ttlResolution;
    ttlAutopurge;
    updateAgeOnGet;
    updateAgeOnHas;
    allowStale;
    noDisposeOnSet;
    noUpdateTTL;
    maxEntrySize;
    sizeCalculation;
    noDeleteOnFetchRejection;
    noDeleteOnStaleGet;
    allowStaleOnFetchAbort;
    allowStaleOnFetchRejection;
    ignoreFetchAbort;
    #h;
    #u;
    #f;
    #a;
    #i;
    #d;
    #E;
    #b;
    #p;
    #R;
    #m;
    #C;
    #T;
    #g;
    #y;
    #x;
    #A;
    #e;
    #_;
    static unsafeExposeInternals(t) {
      return { starts: t.#T, ttls: t.#g, autopurgeTimers: t.#y, sizes: t.#C, keyMap: t.#f, keyList: t.#a, valList: t.#i, next: t.#d, prev: t.#E, get head() {
        return t.#b;
      }, get tail() {
        return t.#p;
      }, free: t.#R, isBackgroundFetch: (e) => t.#l(e), backgroundFetch: (e, s, i, r) => t.#U(e, s, i, r), moveToTail: (e) => t.#W(e), indexes: (e) => t.#F(e), rindexes: (e) => t.#D(e), isStale: (e) => t.#v(e) };
    }
    get max() {
      return this.#t;
    }
    get maxSize() {
      return this.#s;
    }
    get calculatedSize() {
      return this.#u;
    }
    get size() {
      return this.#h;
    }
    get fetchMethod() {
      return this.#S;
    }
    get memoMethod() {
      return this.#w;
    }
    get dispose() {
      return this.#n;
    }
    get onInsert() {
      return this.#r;
    }
    get disposeAfter() {
      return this.#o;
    }
    constructor(t) {
      let { max: e = 0, ttl: s, ttlResolution: i = 1, ttlAutopurge: r, updateAgeOnGet: o, updateAgeOnHas: h, allowStale: a, dispose: l, onInsert: u, disposeAfter: c, noDisposeOnSet: d, noUpdateTTL: f, maxSize: m = 0, maxEntrySize: p = 0, sizeCalculation: w, fetchMethod: g, memoMethod: S, noDeleteOnFetchRejection: E, noDeleteOnStaleGet: y, allowStaleOnFetchRejection: b, allowStaleOnFetchAbort: z, ignoreFetchAbort: $, perf: J } = t;
      if (J !== undefined && typeof J?.now != "function")
        throw new TypeError("perf option must have a now() method if specified");
      if (this.#c = J ?? si, e !== 0 && !q(e))
        throw new TypeError("max option must be a nonnegative integer");
      let Z = e ? De(e) : Array;
      if (!Z)
        throw new Error("invalid max value: " + e);
      if (this.#t = e, this.#s = m, this.maxEntrySize = p || this.#s, this.sizeCalculation = w, this.sizeCalculation) {
        if (!this.#s && !this.maxEntrySize)
          throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
        if (typeof this.sizeCalculation != "function")
          throw new TypeError("sizeCalculation set to non-function");
      }
      if (S !== undefined && typeof S != "function")
        throw new TypeError("memoMethod must be a function if defined");
      if (this.#w = S, g !== undefined && typeof g != "function")
        throw new TypeError("fetchMethod must be a function if specified");
      if (this.#S = g, this.#A = !!g, this.#f = new Map, this.#a = new Array(e).fill(undefined), this.#i = new Array(e).fill(undefined), this.#d = new Z(e), this.#E = new Z(e), this.#b = 0, this.#p = 0, this.#R = ri.create(e), this.#h = 0, this.#u = 0, typeof l == "function" && (this.#n = l), typeof u == "function" && (this.#r = u), typeof c == "function" ? (this.#o = c, this.#m = []) : (this.#o = undefined, this.#m = undefined), this.#x = !!this.#n, this.#_ = !!this.#r, this.#e = !!this.#o, this.noDisposeOnSet = !!d, this.noUpdateTTL = !!f, this.noDeleteOnFetchRejection = !!E, this.allowStaleOnFetchRejection = !!b, this.allowStaleOnFetchAbort = !!z, this.ignoreFetchAbort = !!$, this.maxEntrySize !== 0) {
        if (this.#s !== 0 && !q(this.#s))
          throw new TypeError("maxSize must be a positive integer if specified");
        if (!q(this.maxEntrySize))
          throw new TypeError("maxEntrySize must be a positive integer if specified");
        this.#G();
      }
      if (this.allowStale = !!a, this.noDeleteOnStaleGet = !!y, this.updateAgeOnGet = !!o, this.updateAgeOnHas = !!h, this.ttlResolution = q(i) || i === 0 ? i : 1, this.ttlAutopurge = !!r, this.ttl = s || 0, this.ttl) {
        if (!q(this.ttl))
          throw new TypeError("ttl must be a positive integer if specified");
        this.#M();
      }
      if (this.#t === 0 && this.ttl === 0 && this.#s === 0)
        throw new TypeError("At least one of max, maxSize, or ttl is required");
      if (!this.ttlAutopurge && !this.#t && !this.#s) {
        let $t = "LRU_CACHE_UNBOUNDED";
        ii($t) && (Oe.add($t), Fe("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", $t, Me));
      }
    }
    getRemainingTTL(t) {
      return this.#f.has(t) ? 1 / 0 : 0;
    }
    #M() {
      let t = new Tt(this.#t), e = new Tt(this.#t);
      this.#g = t, this.#T = e;
      let s = this.ttlAutopurge ? new Array(this.#t) : undefined;
      this.#y = s, this.#j = (o, h, a = this.#c.now()) => {
        if (e[o] = h !== 0 ? a : 0, t[o] = h, s?.[o] && (clearTimeout(s[o]), s[o] = undefined), h !== 0 && s) {
          let l = setTimeout(() => {
            this.#v(o) && this.#O(this.#a[o], "expire");
          }, h + 1);
          l.unref && l.unref(), s[o] = l;
        }
      }, this.#k = (o) => {
        e[o] = t[o] !== 0 ? this.#c.now() : 0;
      }, this.#N = (o, h) => {
        if (t[h]) {
          let a = t[h], l = e[h];
          if (!a || !l)
            return;
          o.ttl = a, o.start = l, o.now = i || r();
          let u = o.now - l;
          o.remainingTTL = a - u;
        }
      };
      let i = 0, r = () => {
        let o = this.#c.now();
        if (this.ttlResolution > 0) {
          i = o;
          let h = setTimeout(() => i = 0, this.ttlResolution);
          h.unref && h.unref();
        }
        return o;
      };
      this.getRemainingTTL = (o) => {
        let h = this.#f.get(o);
        if (h === undefined)
          return 0;
        let a = t[h], l = e[h];
        if (!a || !l)
          return 1 / 0;
        let u = (i || r()) - l;
        return a - u;
      }, this.#v = (o) => {
        let h = e[o], a = t[o];
        return !!a && !!h && (i || r()) - h > a;
      };
    }
    #k = () => {};
    #N = () => {};
    #j = () => {};
    #v = () => false;
    #G() {
      let t = new Tt(this.#t);
      this.#u = 0, this.#C = t, this.#P = (e) => {
        this.#u -= t[e], t[e] = 0;
      }, this.#I = (e, s, i, r) => {
        if (this.#l(s))
          return 0;
        if (!q(i))
          if (r) {
            if (typeof r != "function")
              throw new TypeError("sizeCalculation must be a function");
            if (i = r(s, e), !q(i))
              throw new TypeError("sizeCalculation return invalid (expect positive integer)");
          } else
            throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
        return i;
      }, this.#L = (e, s, i) => {
        if (t[e] = s, this.#s) {
          let r = this.#s - t[e];
          for (;this.#u > r; )
            this.#B(true);
        }
        this.#u += t[e], i && (i.entrySize = s, i.totalCalculatedSize = this.#u);
      };
    }
    #P = (t) => {};
    #L = (t, e, s) => {};
    #I = (t, e, s, i) => {
      if (s || i)
        throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
      return 0;
    };
    *#F({ allowStale: t = this.allowStale } = {}) {
      if (this.#h)
        for (let e = this.#p;!(!this.#z(e) || ((t || !this.#v(e)) && (yield e), e === this.#b)); )
          e = this.#E[e];
    }
    *#D({ allowStale: t = this.allowStale } = {}) {
      if (this.#h)
        for (let e = this.#b;!(!this.#z(e) || ((t || !this.#v(e)) && (yield e), e === this.#p)); )
          e = this.#d[e];
    }
    #z(t) {
      return t !== undefined && this.#f.get(this.#a[t]) === t;
    }
    *entries() {
      for (let t of this.#F())
        this.#i[t] !== undefined && this.#a[t] !== undefined && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
    }
    *rentries() {
      for (let t of this.#D())
        this.#i[t] !== undefined && this.#a[t] !== undefined && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
    }
    *keys() {
      for (let t of this.#F()) {
        let e = this.#a[t];
        e !== undefined && !this.#l(this.#i[t]) && (yield e);
      }
    }
    *rkeys() {
      for (let t of this.#D()) {
        let e = this.#a[t];
        e !== undefined && !this.#l(this.#i[t]) && (yield e);
      }
    }
    *values() {
      for (let t of this.#F())
        this.#i[t] !== undefined && !this.#l(this.#i[t]) && (yield this.#i[t]);
    }
    *rvalues() {
      for (let t of this.#D())
        this.#i[t] !== undefined && !this.#l(this.#i[t]) && (yield this.#i[t]);
    }
    [Symbol.iterator]() {
      return this.entries();
    }
    [Symbol.toStringTag] = "LRUCache";
    find(t, e = {}) {
      for (let s of this.#F()) {
        let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
        if (r !== undefined && t(r, this.#a[s], this))
          return this.get(this.#a[s], e);
      }
    }
    forEach(t, e = this) {
      for (let s of this.#F()) {
        let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
        r !== undefined && t.call(e, r, this.#a[s], this);
      }
    }
    rforEach(t, e = this) {
      for (let s of this.#D()) {
        let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
        r !== undefined && t.call(e, r, this.#a[s], this);
      }
    }
    purgeStale() {
      let t = false;
      for (let e of this.#D({ allowStale: true }))
        this.#v(e) && (this.#O(this.#a[e], "expire"), t = true);
      return t;
    }
    info(t) {
      let e = this.#f.get(t);
      if (e === undefined)
        return;
      let s = this.#i[e], i = this.#l(s) ? s.__staleWhileFetching : s;
      if (i === undefined)
        return;
      let r = { value: i };
      if (this.#g && this.#T) {
        let o = this.#g[e], h = this.#T[e];
        if (o && h) {
          let a = o - (this.#c.now() - h);
          r.ttl = a, r.start = Date.now();
        }
      }
      return this.#C && (r.size = this.#C[e]), r;
    }
    dump() {
      let t = [];
      for (let e of this.#F({ allowStale: true })) {
        let s = this.#a[e], i = this.#i[e], r = this.#l(i) ? i.__staleWhileFetching : i;
        if (r === undefined || s === undefined)
          continue;
        let o = { value: r };
        if (this.#g && this.#T) {
          o.ttl = this.#g[e];
          let h = this.#c.now() - this.#T[e];
          o.start = Math.floor(Date.now() - h);
        }
        this.#C && (o.size = this.#C[e]), t.unshift([s, o]);
      }
      return t;
    }
    load(t) {
      this.clear();
      for (let [e, s] of t) {
        if (s.start) {
          let i = Date.now() - s.start;
          s.start = this.#c.now() - i;
        }
        this.set(e, s.value, s);
      }
    }
    set(t, e, s = {}) {
      if (e === undefined)
        return this.delete(t), this;
      let { ttl: i = this.ttl, start: r, noDisposeOnSet: o = this.noDisposeOnSet, sizeCalculation: h = this.sizeCalculation, status: a } = s, { noUpdateTTL: l = this.noUpdateTTL } = s, u = this.#I(t, e, s.size || 0, h);
      if (this.maxEntrySize && u > this.maxEntrySize)
        return a && (a.set = "miss", a.maxEntrySizeExceeded = true), this.#O(t, "set"), this;
      let c = this.#h === 0 ? undefined : this.#f.get(t);
      if (c === undefined)
        c = this.#h === 0 ? this.#p : this.#R.length !== 0 ? this.#R.pop() : this.#h === this.#t ? this.#B(false) : this.#h, this.#a[c] = t, this.#i[c] = e, this.#f.set(t, c), this.#d[this.#p] = c, this.#E[c] = this.#p, this.#p = c, this.#h++, this.#L(c, u, a), a && (a.set = "add"), l = false, this.#_ && this.#r?.(e, t, "add");
      else {
        this.#W(c);
        let d = this.#i[c];
        if (e !== d) {
          if (this.#A && this.#l(d)) {
            d.__abortController.abort(new Error("replaced"));
            let { __staleWhileFetching: f } = d;
            f !== undefined && !o && (this.#x && this.#n?.(f, t, "set"), this.#e && this.#m?.push([f, t, "set"]));
          } else
            o || (this.#x && this.#n?.(d, t, "set"), this.#e && this.#m?.push([d, t, "set"]));
          if (this.#P(c), this.#L(c, u, a), this.#i[c] = e, a) {
            a.set = "replace";
            let f = d && this.#l(d) ? d.__staleWhileFetching : d;
            f !== undefined && (a.oldValue = f);
          }
        } else
          a && (a.set = "update");
        this.#_ && this.onInsert?.(e, t, e === d ? "update" : "replace");
      }
      if (i !== 0 && !this.#g && this.#M(), this.#g && (l || this.#j(c, i, r), a && this.#N(a, c)), !o && this.#e && this.#m) {
        let d = this.#m, f;
        for (;f = d?.shift(); )
          this.#o?.(...f);
      }
      return this;
    }
    pop() {
      try {
        for (;this.#h; ) {
          let t = this.#i[this.#b];
          if (this.#B(true), this.#l(t)) {
            if (t.__staleWhileFetching)
              return t.__staleWhileFetching;
          } else if (t !== undefined)
            return t;
        }
      } finally {
        if (this.#e && this.#m) {
          let t = this.#m, e;
          for (;e = t?.shift(); )
            this.#o?.(...e);
        }
      }
    }
    #B(t) {
      let e = this.#b, s = this.#a[e], i = this.#i[e];
      return this.#A && this.#l(i) ? i.__abortController.abort(new Error("evicted")) : (this.#x || this.#e) && (this.#x && this.#n?.(i, s, "evict"), this.#e && this.#m?.push([i, s, "evict"])), this.#P(e), this.#y?.[e] && (clearTimeout(this.#y[e]), this.#y[e] = undefined), t && (this.#a[e] = undefined, this.#i[e] = undefined, this.#R.push(e)), this.#h === 1 ? (this.#b = this.#p = 0, this.#R.length = 0) : this.#b = this.#d[e], this.#f.delete(s), this.#h--, e;
    }
    has(t, e = {}) {
      let { updateAgeOnHas: s = this.updateAgeOnHas, status: i } = e, r = this.#f.get(t);
      if (r !== undefined) {
        let o = this.#i[r];
        if (this.#l(o) && o.__staleWhileFetching === undefined)
          return false;
        if (this.#v(r))
          i && (i.has = "stale", this.#N(i, r));
        else
          return s && this.#k(r), i && (i.has = "hit", this.#N(i, r)), true;
      } else
        i && (i.has = "miss");
      return false;
    }
    peek(t, e = {}) {
      let { allowStale: s = this.allowStale } = e, i = this.#f.get(t);
      if (i === undefined || !s && this.#v(i))
        return;
      let r = this.#i[i];
      return this.#l(r) ? r.__staleWhileFetching : r;
    }
    #U(t, e, s, i) {
      let r = e === undefined ? undefined : this.#i[e];
      if (this.#l(r))
        return r;
      let o = new At, { signal: h } = s;
      h?.addEventListener("abort", () => o.abort(h.reason), { signal: o.signal });
      let a = { signal: o.signal, options: s, context: i }, l = (p, w = false) => {
        let { aborted: g } = o.signal, S = s.ignoreFetchAbort && p !== undefined, E = s.ignoreFetchAbort || !!(s.allowStaleOnFetchAbort && p !== undefined);
        if (s.status && (g && !w ? (s.status.fetchAborted = true, s.status.fetchError = o.signal.reason, S && (s.status.fetchAbortIgnored = true)) : s.status.fetchResolved = true), g && !S && !w)
          return c(o.signal.reason, E);
        let y = f, b = this.#i[e];
        return (b === f || S && w && b === undefined) && (p === undefined ? y.__staleWhileFetching !== undefined ? this.#i[e] = y.__staleWhileFetching : this.#O(t, "fetch") : (s.status && (s.status.fetchUpdated = true), this.set(t, p, a.options))), p;
      }, u = (p) => (s.status && (s.status.fetchRejected = true, s.status.fetchError = p), c(p, false)), c = (p, w) => {
        let { aborted: g } = o.signal, S = g && s.allowStaleOnFetchAbort, E = S || s.allowStaleOnFetchRejection, y = E || s.noDeleteOnFetchRejection, b = f;
        if (this.#i[e] === f && (!y || !w && b.__staleWhileFetching === undefined ? this.#O(t, "fetch") : S || (this.#i[e] = b.__staleWhileFetching)), E)
          return s.status && b.__staleWhileFetching !== undefined && (s.status.returnedStale = true), b.__staleWhileFetching;
        if (b.__returned === b)
          throw p;
      }, d = (p, w) => {
        let g = this.#S?.(t, r, a);
        g && g instanceof Promise && g.then((S) => p(S === undefined ? undefined : S), w), o.signal.addEventListener("abort", () => {
          (!s.ignoreFetchAbort || s.allowStaleOnFetchAbort) && (p(undefined), s.allowStaleOnFetchAbort && (p = (S) => l(S, true)));
        });
      };
      s.status && (s.status.fetchDispatched = true);
      let f = new Promise(d).then(l, u), m = Object.assign(f, { __abortController: o, __staleWhileFetching: r, __returned: undefined });
      return e === undefined ? (this.set(t, m, { ...a.options, status: undefined }), e = this.#f.get(t)) : this.#i[e] = m, m;
    }
    #l(t) {
      if (!this.#A)
        return false;
      let e = t;
      return !!e && e instanceof Promise && e.hasOwnProperty("__staleWhileFetching") && e.__abortController instanceof At;
    }
    async fetch(t, e = {}) {
      let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r = this.noDeleteOnStaleGet, ttl: o = this.ttl, noDisposeOnSet: h = this.noDisposeOnSet, size: a = 0, sizeCalculation: l = this.sizeCalculation, noUpdateTTL: u = this.noUpdateTTL, noDeleteOnFetchRejection: c = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: d = this.allowStaleOnFetchRejection, ignoreFetchAbort: f = this.ignoreFetchAbort, allowStaleOnFetchAbort: m = this.allowStaleOnFetchAbort, context: p, forceRefresh: w = false, status: g, signal: S } = e;
      if (!this.#A)
        return g && (g.fetch = "get"), this.get(t, { allowStale: s, updateAgeOnGet: i, noDeleteOnStaleGet: r, status: g });
      let E = { allowStale: s, updateAgeOnGet: i, noDeleteOnStaleGet: r, ttl: o, noDisposeOnSet: h, size: a, sizeCalculation: l, noUpdateTTL: u, noDeleteOnFetchRejection: c, allowStaleOnFetchRejection: d, allowStaleOnFetchAbort: m, ignoreFetchAbort: f, status: g, signal: S }, y = this.#f.get(t);
      if (y === undefined) {
        g && (g.fetch = "miss");
        let b = this.#U(t, y, E, p);
        return b.__returned = b;
      } else {
        let b = this.#i[y];
        if (this.#l(b)) {
          let Z = s && b.__staleWhileFetching !== undefined;
          return g && (g.fetch = "inflight", Z && (g.returnedStale = true)), Z ? b.__staleWhileFetching : b.__returned = b;
        }
        let z = this.#v(y);
        if (!w && !z)
          return g && (g.fetch = "hit"), this.#W(y), i && this.#k(y), g && this.#N(g, y), b;
        let $ = this.#U(t, y, E, p), J = $.__staleWhileFetching !== undefined && s;
        return g && (g.fetch = z ? "stale" : "refresh", J && z && (g.returnedStale = true)), J ? $.__staleWhileFetching : $.__returned = $;
      }
    }
    async forceFetch(t, e = {}) {
      let s = await this.fetch(t, e);
      if (s === undefined)
        throw new Error("fetch() returned undefined");
      return s;
    }
    memo(t, e = {}) {
      let s = this.#w;
      if (!s)
        throw new Error("no memoMethod provided to constructor");
      let { context: i, forceRefresh: r, ...o } = e, h = this.get(t, o);
      if (!r && h !== undefined)
        return h;
      let a = s(t, h, { options: o, context: i });
      return this.set(t, a, o), a;
    }
    get(t, e = {}) {
      let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r = this.noDeleteOnStaleGet, status: o } = e, h = this.#f.get(t);
      if (h !== undefined) {
        let a = this.#i[h], l = this.#l(a);
        return o && this.#N(o, h), this.#v(h) ? (o && (o.get = "stale"), l ? (o && s && a.__staleWhileFetching !== undefined && (o.returnedStale = true), s ? a.__staleWhileFetching : undefined) : (r || this.#O(t, "expire"), o && s && (o.returnedStale = true), s ? a : undefined)) : (o && (o.get = "hit"), l ? a.__staleWhileFetching : (this.#W(h), i && this.#k(h), a));
      } else
        o && (o.get = "miss");
    }
    #$(t, e) {
      this.#E[e] = t, this.#d[t] = e;
    }
    #W(t) {
      t !== this.#p && (t === this.#b ? this.#b = this.#d[t] : this.#$(this.#E[t], this.#d[t]), this.#$(this.#p, t), this.#p = t);
    }
    delete(t) {
      return this.#O(t, "delete");
    }
    #O(t, e) {
      let s = false;
      if (this.#h !== 0) {
        let i = this.#f.get(t);
        if (i !== undefined)
          if (this.#y?.[i] && (clearTimeout(this.#y?.[i]), this.#y[i] = undefined), s = true, this.#h === 1)
            this.#H(e);
          else {
            this.#P(i);
            let r = this.#i[i];
            if (this.#l(r) ? r.__abortController.abort(new Error("deleted")) : (this.#x || this.#e) && (this.#x && this.#n?.(r, t, e), this.#e && this.#m?.push([r, t, e])), this.#f.delete(t), this.#a[i] = undefined, this.#i[i] = undefined, i === this.#p)
              this.#p = this.#E[i];
            else if (i === this.#b)
              this.#b = this.#d[i];
            else {
              let o = this.#E[i];
              this.#d[o] = this.#d[i];
              let h = this.#d[i];
              this.#E[h] = this.#E[i];
            }
            this.#h--, this.#R.push(i);
          }
      }
      if (this.#e && this.#m?.length) {
        let i = this.#m, r;
        for (;r = i?.shift(); )
          this.#o?.(...r);
      }
      return s;
    }
    clear() {
      return this.#H("delete");
    }
    #H(t) {
      for (let e of this.#D({ allowStale: true })) {
        let s = this.#i[e];
        if (this.#l(s))
          s.__abortController.abort(new Error("deleted"));
        else {
          let i = this.#a[e];
          this.#x && this.#n?.(s, i, t), this.#e && this.#m?.push([s, i, t]);
        }
      }
      if (this.#f.clear(), this.#i.fill(undefined), this.#a.fill(undefined), this.#g && this.#T) {
        this.#g.fill(0), this.#T.fill(0);
        for (let e of this.#y ?? [])
          e !== undefined && clearTimeout(e);
        this.#y?.fill(undefined);
      }
      if (this.#C && this.#C.fill(0), this.#b = 0, this.#p = 0, this.#R.length = 0, this.#u = 0, this.#h = 0, this.#e && this.#m) {
        let e = this.#m, s;
        for (;s = e?.shift(); )
          this.#o?.(...s);
      }
    }
  };
  Ne = typeof process == "object" && process ? process : { stdout: null, stderr: null };
  G = Symbol("EOF");
  H = Symbol("maybeEmitEnd");
  K = Symbol("emittedEnd");
  kt = Symbol("emittingEnd");
  ut = Symbol("emittedError");
  Rt = Symbol("closed");
  _e = Symbol("read");
  Ot = Symbol("flush");
  Le = Symbol("flushChunk");
  P = Symbol("encoding");
  et = Symbol("decoder");
  v = Symbol("flowing");
  dt = Symbol("paused");
  st = Symbol("resume");
  C = Symbol("buffer");
  F = Symbol("pipes");
  T = Symbol("bufferLength");
  Yt = Symbol("bufferPush");
  Ft = Symbol("bufferShift");
  k = Symbol("objectMode");
  x = Symbol("destroyed");
  Xt = Symbol("error");
  Jt = Symbol("emitData");
  We = Symbol("emitEnd");
  Zt = Symbol("emitEnd2");
  B = Symbol("async");
  Qt = Symbol("abort");
  Dt = Symbol("aborted");
  pt = Symbol("signal");
  Y = Symbol("dataListeners");
  M = Symbol("discarded");
  te = class extends Mt {
    unpipe() {
      this.src.removeListener("error", this.proxyErrors), super.unpipe();
    }
    constructor(t, e, s) {
      super(t, e, s), this.proxyErrors = (i) => this.dest.emit("error", i), t.on("error", this.proxyErrors);
    }
  };
  V = class extends ee {
    [v] = false;
    [dt] = false;
    [F] = [];
    [C] = [];
    [k];
    [P];
    [B];
    [et];
    [G] = false;
    [K] = false;
    [kt] = false;
    [Rt] = false;
    [ut] = null;
    [T] = 0;
    [x] = false;
    [pt];
    [Dt] = false;
    [Y] = 0;
    [M] = false;
    writable = true;
    readable = true;
    constructor(...t) {
      let e = t[0] || {};
      if (super(), e.objectMode && typeof e.encoding == "string")
        throw new TypeError("Encoding and objectMode may not be used together");
      di(e) ? (this[k] = true, this[P] = null) : pi(e) ? (this[P] = e.encoding, this[k] = false) : (this[k] = false, this[P] = null), this[B] = !!e.async, this[et] = this[P] ? new ni(this[P]) : null, e && e.debugExposeBuffer === true && Object.defineProperty(this, "buffer", { get: () => this[C] }), e && e.debugExposePipes === true && Object.defineProperty(this, "pipes", { get: () => this[F] });
      let { signal: s } = e;
      s && (this[pt] = s, s.aborted ? this[Qt]() : s.addEventListener("abort", () => this[Qt]()));
    }
    get bufferLength() {
      return this[T];
    }
    get encoding() {
      return this[P];
    }
    set encoding(t) {
      throw new Error("Encoding must be set at instantiation time");
    }
    setEncoding(t) {
      throw new Error("Encoding must be set at instantiation time");
    }
    get objectMode() {
      return this[k];
    }
    set objectMode(t) {
      throw new Error("objectMode must be set at instantiation time");
    }
    get async() {
      return this[B];
    }
    set async(t) {
      this[B] = this[B] || !!t;
    }
    [Qt]() {
      this[Dt] = true, this.emit("abort", this[pt]?.reason), this.destroy(this[pt]?.reason);
    }
    get aborted() {
      return this[Dt];
    }
    set aborted(t) {}
    write(t, e, s) {
      if (this[Dt])
        return false;
      if (this[G])
        throw new Error("write after end");
      if (this[x])
        return this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" })), true;
      typeof e == "function" && (s = e, e = "utf8"), e || (e = "utf8");
      let i = this[B] ? mt : li;
      if (!this[k] && !Buffer.isBuffer(t)) {
        if (ui(t))
          t = Buffer.from(t.buffer, t.byteOffset, t.byteLength);
        else if (fi(t))
          t = Buffer.from(t);
        else if (typeof t != "string")
          throw new Error("Non-contiguous data written to non-objectMode stream");
      }
      return this[k] ? (this[v] && this[T] !== 0 && this[Ot](true), this[v] ? this.emit("data", t) : this[Yt](t), this[T] !== 0 && this.emit("readable"), s && i(s), this[v]) : t.length ? (typeof t == "string" && !(e === this[P] && !this[et]?.lastNeed) && (t = Buffer.from(t, e)), Buffer.isBuffer(t) && this[P] && (t = this[et].write(t)), this[v] && this[T] !== 0 && this[Ot](true), this[v] ? this.emit("data", t) : this[Yt](t), this[T] !== 0 && this.emit("readable"), s && i(s), this[v]) : (this[T] !== 0 && this.emit("readable"), s && i(s), this[v]);
    }
    read(t) {
      if (this[x])
        return null;
      if (this[M] = false, this[T] === 0 || t === 0 || t && t > this[T])
        return this[H](), null;
      this[k] && (t = null), this[C].length > 1 && !this[k] && (this[C] = [this[P] ? this[C].join("") : Buffer.concat(this[C], this[T])]);
      let e = this[_e](t || null, this[C][0]);
      return this[H](), e;
    }
    [_e](t, e) {
      if (this[k])
        this[Ft]();
      else {
        let s = e;
        t === s.length || t === null ? this[Ft]() : typeof s == "string" ? (this[C][0] = s.slice(t), e = s.slice(0, t), this[T] -= t) : (this[C][0] = s.subarray(t), e = s.subarray(0, t), this[T] -= t);
      }
      return this.emit("data", e), !this[C].length && !this[G] && this.emit("drain"), e;
    }
    end(t, e, s) {
      return typeof t == "function" && (s = t, t = undefined), typeof e == "function" && (s = e, e = "utf8"), t !== undefined && this.write(t, e), s && this.once("end", s), this[G] = true, this.writable = false, (this[v] || !this[dt]) && this[H](), this;
    }
    [st]() {
      this[x] || (!this[Y] && !this[F].length && (this[M] = true), this[dt] = false, this[v] = true, this.emit("resume"), this[C].length ? this[Ot]() : this[G] ? this[H]() : this.emit("drain"));
    }
    resume() {
      return this[st]();
    }
    pause() {
      this[v] = false, this[dt] = true, this[M] = false;
    }
    get destroyed() {
      return this[x];
    }
    get flowing() {
      return this[v];
    }
    get paused() {
      return this[dt];
    }
    [Yt](t) {
      this[k] ? this[T] += 1 : this[T] += t.length, this[C].push(t);
    }
    [Ft]() {
      return this[k] ? this[T] -= 1 : this[T] -= this[C][0].length, this[C].shift();
    }
    [Ot](t = false) {
      do
        ;
      while (this[Le](this[Ft]()) && this[C].length);
      !t && !this[C].length && !this[G] && this.emit("drain");
    }
    [Le](t) {
      return this.emit("data", t), this[v];
    }
    pipe(t, e) {
      if (this[x])
        return t;
      this[M] = false;
      let s = this[K];
      return e = e || {}, t === Ne.stdout || t === Ne.stderr ? e.end = false : e.end = e.end !== false, e.proxyErrors = !!e.proxyErrors, s ? e.end && t.end() : (this[F].push(e.proxyErrors ? new te(this, t, e) : new Mt(this, t, e)), this[B] ? mt(() => this[st]()) : this[st]()), t;
    }
    unpipe(t) {
      let e = this[F].find((s) => s.dest === t);
      e && (this[F].length === 1 ? (this[v] && this[Y] === 0 && (this[v] = false), this[F] = []) : this[F].splice(this[F].indexOf(e), 1), e.unpipe());
    }
    addListener(t, e) {
      return this.on(t, e);
    }
    on(t, e) {
      let s = super.on(t, e);
      if (t === "data")
        this[M] = false, this[Y]++, !this[F].length && !this[v] && this[st]();
      else if (t === "readable" && this[T] !== 0)
        super.emit("readable");
      else if (ci(t) && this[K])
        super.emit(t), this.removeAllListeners(t);
      else if (t === "error" && this[ut]) {
        let i = e;
        this[B] ? mt(() => i.call(this, this[ut])) : i.call(this, this[ut]);
      }
      return s;
    }
    removeListener(t, e) {
      return this.off(t, e);
    }
    off(t, e) {
      let s = super.off(t, e);
      return t === "data" && (this[Y] = this.listeners("data").length, this[Y] === 0 && !this[M] && !this[F].length && (this[v] = false)), s;
    }
    removeAllListeners(t) {
      let e = super.removeAllListeners(t);
      return (t === "data" || t === undefined) && (this[Y] = 0, !this[M] && !this[F].length && (this[v] = false)), e;
    }
    get emittedEnd() {
      return this[K];
    }
    [H]() {
      !this[kt] && !this[K] && !this[x] && this[C].length === 0 && this[G] && (this[kt] = true, this.emit("end"), this.emit("prefinish"), this.emit("finish"), this[Rt] && this.emit("close"), this[kt] = false);
    }
    emit(t, ...e) {
      let s = e[0];
      if (t !== "error" && t !== "close" && t !== x && this[x])
        return false;
      if (t === "data")
        return !this[k] && !s ? false : this[B] ? (mt(() => this[Jt](s)), true) : this[Jt](s);
      if (t === "end")
        return this[We]();
      if (t === "close") {
        if (this[Rt] = true, !this[K] && !this[x])
          return false;
        let r = super.emit("close");
        return this.removeAllListeners("close"), r;
      } else if (t === "error") {
        this[ut] = s, super.emit(Xt, s);
        let r = !this[pt] || this.listeners("error").length ? super.emit("error", s) : false;
        return this[H](), r;
      } else if (t === "resume") {
        let r = super.emit("resume");
        return this[H](), r;
      } else if (t === "finish" || t === "prefinish") {
        let r = super.emit(t);
        return this.removeAllListeners(t), r;
      }
      let i = super.emit(t, ...e);
      return this[H](), i;
    }
    [Jt](t) {
      for (let s of this[F])
        s.dest.write(t) === false && this.pause();
      let e = this[M] ? false : super.emit("data", t);
      return this[H](), e;
    }
    [We]() {
      return this[K] ? false : (this[K] = true, this.readable = false, this[B] ? (mt(() => this[Zt]()), true) : this[Zt]());
    }
    [Zt]() {
      if (this[et]) {
        let e = this[et].end();
        if (e) {
          for (let s of this[F])
            s.dest.write(e);
          this[M] || super.emit("data", e);
        }
      }
      for (let e of this[F])
        e.end();
      let t = super.emit("end");
      return this.removeAllListeners("end"), t;
    }
    async collect() {
      let t = Object.assign([], { dataLength: 0 });
      this[k] || (t.dataLength = 0);
      let e = this.promise();
      return this.on("data", (s) => {
        t.push(s), this[k] || (t.dataLength += s.length);
      }), await e, t;
    }
    async concat() {
      if (this[k])
        throw new Error("cannot concat in objectMode");
      let t = await this.collect();
      return this[P] ? t.join("") : Buffer.concat(t, t.dataLength);
    }
    async promise() {
      return new Promise((t, e) => {
        this.on(x, () => e(new Error("stream destroyed"))), this.on("error", (s) => e(s)), this.on("end", () => t());
      });
    }
    [Symbol.asyncIterator]() {
      this[M] = false;
      let t = false, e = async () => (this.pause(), t = true, { value: undefined, done: true });
      return { next: () => {
        if (t)
          return e();
        let i = this.read();
        if (i !== null)
          return Promise.resolve({ done: false, value: i });
        if (this[G])
          return e();
        let r, o, h = (c) => {
          this.off("data", a), this.off("end", l), this.off(x, u), e(), o(c);
        }, a = (c) => {
          this.off("error", h), this.off("end", l), this.off(x, u), this.pause(), r({ value: c, done: !!this[G] });
        }, l = () => {
          this.off("error", h), this.off("data", a), this.off(x, u), e(), r({ done: true, value: undefined });
        }, u = () => h(new Error("stream destroyed"));
        return new Promise((c, d) => {
          o = d, r = c, this.once(x, u), this.once("error", h), this.once("end", l), this.once("data", a);
        });
      }, throw: e, return: e, [Symbol.asyncIterator]() {
        return this;
      }, [Symbol.asyncDispose]: async () => {} };
    }
    [Symbol.iterator]() {
      this[M] = false;
      let t = false, e = () => (this.pause(), this.off(Xt, e), this.off(x, e), this.off("end", e), t = true, { done: true, value: undefined }), s = () => {
        if (t)
          return e();
        let i = this.read();
        return i === null ? e() : { done: false, value: i };
      };
      return this.once("end", e), this.once(Xt, e), this.once(x, e), { next: s, throw: e, return: e, [Symbol.iterator]() {
        return this;
      }, [Symbol.dispose]: () => {} };
    }
    destroy(t) {
      if (this[x])
        return t ? this.emit("error", t) : this.emit(x), this;
      this[x] = true, this[M] = true, this[C].length = 0, this[T] = 0;
      let e = this;
      return typeof e.close == "function" && !this[Rt] && e.close(), t ? this.emit("error", t) : this.emit(x), this;
    }
    static get isStream() {
      return oi;
    }
  };
  vi = Ei.native;
  wt = { lstatSync: wi, readdir: yi, readdirSync: bi, readlinkSync: Si, realpathSync: vi, promises: { lstat: Ci, readdir: Ti, readlink: Ai, realpath: ki } };
  $e = /^\\\\\?\\([a-z]:)\\?$/i;
  Oi = /[\\\/]/;
  gt = ~_;
  Ie = yt | j | Lt;
  ze = new ft({ max: 2 ** 12 });
  Be = new ft({ max: 2 ** 12 });
  Wt = class extends ft {
    constructor() {
      super({ max: 256 });
    }
  };
  ne = class extends ft {
    constructor(t = 16 * 1024) {
      super({ maxSize: t, sizeCalculation: (e) => e.length + 1 });
    }
  };
  Ye = Symbol("PathScurry setAsCwd");
  R = class {
    name;
    root;
    roots;
    parent;
    nocase;
    isCWD = false;
    #t;
    #s;
    get dev() {
      return this.#s;
    }
    #n;
    get mode() {
      return this.#n;
    }
    #r;
    get nlink() {
      return this.#r;
    }
    #o;
    get uid() {
      return this.#o;
    }
    #S;
    get gid() {
      return this.#S;
    }
    #w;
    get rdev() {
      return this.#w;
    }
    #c;
    get blksize() {
      return this.#c;
    }
    #h;
    get ino() {
      return this.#h;
    }
    #u;
    get size() {
      return this.#u;
    }
    #f;
    get blocks() {
      return this.#f;
    }
    #a;
    get atimeMs() {
      return this.#a;
    }
    #i;
    get mtimeMs() {
      return this.#i;
    }
    #d;
    get ctimeMs() {
      return this.#d;
    }
    #E;
    get birthtimeMs() {
      return this.#E;
    }
    #b;
    get atime() {
      return this.#b;
    }
    #p;
    get mtime() {
      return this.#p;
    }
    #R;
    get ctime() {
      return this.#R;
    }
    #m;
    get birthtime() {
      return this.#m;
    }
    #C;
    #T;
    #g;
    #y;
    #x;
    #A;
    #e;
    #_;
    #M;
    #k;
    get parentPath() {
      return (this.parent || this).fullpath();
    }
    get path() {
      return this.parentPath;
    }
    constructor(t, e = L, s, i, r, o, h) {
      this.name = t, this.#C = r ? _t(t) : bt(t), this.#e = e & Fi, this.nocase = r, this.roots = i, this.root = s || this, this.#_ = o, this.#g = h.fullpath, this.#x = h.relative, this.#A = h.relativePosix, this.parent = h.parent, this.parent ? this.#t = this.parent.#t : this.#t = Ue(h.fs);
    }
    depth() {
      return this.#T !== undefined ? this.#T : this.parent ? this.#T = this.parent.depth() + 1 : this.#T = 0;
    }
    childrenCache() {
      return this.#_;
    }
    resolve(t) {
      if (!t)
        return this;
      let e = this.getRootString(t), i = t.substring(e.length).split(this.splitSep);
      return e ? this.getRoot(e).#N(i) : this.#N(i);
    }
    #N(t) {
      let e = this;
      for (let s of t)
        e = e.child(s);
      return e;
    }
    children() {
      let t = this.#_.get(this);
      if (t)
        return t;
      let e = Object.assign([], { provisional: 0 });
      return this.#_.set(this, e), this.#e &= ~se, e;
    }
    child(t, e) {
      if (t === "" || t === ".")
        return this;
      if (t === "..")
        return this.parent || this;
      let s = this.children(), i = this.nocase ? _t(t) : bt(t);
      for (let a of s)
        if (a.#C === i)
          return a;
      let r = this.parent ? this.sep : "", o = this.#g ? this.#g + r + t : undefined, h = this.newChild(t, L, { ...e, parent: this, fullpath: o });
      return this.canReaddir() || (h.#e |= j), s.push(h), h;
    }
    relative() {
      if (this.isCWD)
        return "";
      if (this.#x !== undefined)
        return this.#x;
      let t = this.name, e = this.parent;
      if (!e)
        return this.#x = this.name;
      let s = e.relative();
      return s + (!s || !e.parent ? "" : this.sep) + t;
    }
    relativePosix() {
      if (this.sep === "/")
        return this.relative();
      if (this.isCWD)
        return "";
      if (this.#A !== undefined)
        return this.#A;
      let t = this.name, e = this.parent;
      if (!e)
        return this.#A = this.fullpathPosix();
      let s = e.relativePosix();
      return s + (!s || !e.parent ? "" : "/") + t;
    }
    fullpath() {
      if (this.#g !== undefined)
        return this.#g;
      let t = this.name, e = this.parent;
      if (!e)
        return this.#g = this.name;
      let i = e.fullpath() + (e.parent ? this.sep : "") + t;
      return this.#g = i;
    }
    fullpathPosix() {
      if (this.#y !== undefined)
        return this.#y;
      if (this.sep === "/")
        return this.#y = this.fullpath();
      if (!this.parent) {
        let i = this.fullpath().replace(/\\/g, "/");
        return /^[a-z]:\//i.test(i) ? this.#y = `//?/${i}` : this.#y = i;
      }
      let t = this.parent, e = t.fullpathPosix(), s = e + (!e || !t.parent ? "" : "/") + this.name;
      return this.#y = s;
    }
    isUnknown() {
      return (this.#e & _) === L;
    }
    isType(t) {
      return this[`is${t}`]();
    }
    getType() {
      return this.isUnknown() ? "Unknown" : this.isDirectory() ? "Directory" : this.isFile() ? "File" : this.isSymbolicLink() ? "SymbolicLink" : this.isFIFO() ? "FIFO" : this.isCharacterDevice() ? "CharacterDevice" : this.isBlockDevice() ? "BlockDevice" : this.isSocket() ? "Socket" : "Unknown";
    }
    isFile() {
      return (this.#e & _) === Ke;
    }
    isDirectory() {
      return (this.#e & _) === U;
    }
    isCharacterDevice() {
      return (this.#e & _) === He;
    }
    isBlockDevice() {
      return (this.#e & _) === qe;
    }
    isFIFO() {
      return (this.#e & _) === Ge;
    }
    isSocket() {
      return (this.#e & _) === Ve;
    }
    isSymbolicLink() {
      return (this.#e & X) === X;
    }
    lstatCached() {
      return this.#e & je ? this : undefined;
    }
    readlinkCached() {
      return this.#M;
    }
    realpathCached() {
      return this.#k;
    }
    readdirCached() {
      let t = this.children();
      return t.slice(0, t.provisional);
    }
    canReadlink() {
      if (this.#M)
        return true;
      if (!this.parent)
        return false;
      let t = this.#e & _;
      return !(t !== L && t !== X || this.#e & Nt || this.#e & j);
    }
    calledReaddir() {
      return !!(this.#e & se);
    }
    isENOENT() {
      return !!(this.#e & j);
    }
    isNamed(t) {
      return this.nocase ? this.#C === _t(t) : this.#C === bt(t);
    }
    async readlink() {
      let t = this.#M;
      if (t)
        return t;
      if (this.canReadlink() && this.parent)
        try {
          let e = await this.#t.promises.readlink(this.fullpath()), s = (await this.parent.realpath())?.resolve(e);
          if (s)
            return this.#M = s;
        } catch (e) {
          this.#D(e.code);
          return;
        }
    }
    readlinkSync() {
      let t = this.#M;
      if (t)
        return t;
      if (this.canReadlink() && this.parent)
        try {
          let e = this.#t.readlinkSync(this.fullpath()), s = this.parent.realpathSync()?.resolve(e);
          if (s)
            return this.#M = s;
        } catch (e) {
          this.#D(e.code);
          return;
        }
    }
    #j(t) {
      this.#e |= se;
      for (let e = t.provisional;e < t.length; e++) {
        let s = t[e];
        s && s.#v();
      }
    }
    #v() {
      this.#e & j || (this.#e = (this.#e | j) & gt, this.#G());
    }
    #G() {
      let t = this.children();
      t.provisional = 0;
      for (let e of t)
        e.#v();
    }
    #P() {
      this.#e |= Lt, this.#L();
    }
    #L() {
      if (this.#e & yt)
        return;
      let t = this.#e;
      (t & _) === U && (t &= gt), this.#e = t | yt, this.#G();
    }
    #I(t = "") {
      t === "ENOTDIR" || t === "EPERM" ? this.#L() : t === "ENOENT" ? this.#v() : this.children().provisional = 0;
    }
    #F(t = "") {
      t === "ENOTDIR" ? this.parent.#L() : t === "ENOENT" && this.#v();
    }
    #D(t = "") {
      let e = this.#e;
      e |= Nt, t === "ENOENT" && (e |= j), (t === "EINVAL" || t === "UNKNOWN") && (e &= gt), this.#e = e, t === "ENOTDIR" && this.parent && this.parent.#L();
    }
    #z(t, e) {
      return this.#U(t, e) || this.#B(t, e);
    }
    #B(t, e) {
      let s = ie(t), i = this.newChild(t.name, s, { parent: this }), r = i.#e & _;
      return r !== U && r !== X && r !== L && (i.#e |= yt), e.unshift(i), e.provisional++, i;
    }
    #U(t, e) {
      for (let s = e.provisional;s < e.length; s++) {
        let i = e[s];
        if ((this.nocase ? _t(t.name) : bt(t.name)) === i.#C)
          return this.#l(t, i, s, e);
      }
    }
    #l(t, e, s, i) {
      let r = e.name;
      return e.#e = e.#e & gt | ie(t), r !== t.name && (e.name = t.name), s !== i.provisional && (s === i.length - 1 ? i.pop() : i.splice(s, 1), i.unshift(e)), i.provisional++, e;
    }
    async lstat() {
      if ((this.#e & j) === 0)
        try {
          return this.#$(await this.#t.promises.lstat(this.fullpath())), this;
        } catch (t) {
          this.#F(t.code);
        }
    }
    lstatSync() {
      if ((this.#e & j) === 0)
        try {
          return this.#$(this.#t.lstatSync(this.fullpath())), this;
        } catch (t) {
          this.#F(t.code);
        }
    }
    #$(t) {
      let { atime: e, atimeMs: s, birthtime: i, birthtimeMs: r, blksize: o, blocks: h, ctime: a, ctimeMs: l, dev: u, gid: c, ino: d, mode: f, mtime: m, mtimeMs: p, nlink: w, rdev: g, size: S, uid: E } = t;
      this.#b = e, this.#a = s, this.#m = i, this.#E = r, this.#c = o, this.#f = h, this.#R = a, this.#d = l, this.#s = u, this.#S = c, this.#h = d, this.#n = f, this.#p = m, this.#i = p, this.#r = w, this.#w = g, this.#u = S, this.#o = E;
      let y = ie(t);
      this.#e = this.#e & gt | y | je, y !== L && y !== U && y !== X && (this.#e |= yt);
    }
    #W = [];
    #O = false;
    #H(t) {
      this.#O = false;
      let e = this.#W.slice();
      this.#W.length = 0, e.forEach((s) => s(null, t));
    }
    readdirCB(t, e = false) {
      if (!this.canReaddir()) {
        e ? t(null, []) : queueMicrotask(() => t(null, []));
        return;
      }
      let s = this.children();
      if (this.calledReaddir()) {
        let r = s.slice(0, s.provisional);
        e ? t(null, r) : queueMicrotask(() => t(null, r));
        return;
      }
      if (this.#W.push(t), this.#O)
        return;
      this.#O = true;
      let i = this.fullpath();
      this.#t.readdir(i, { withFileTypes: true }, (r, o) => {
        if (r)
          this.#I(r.code), s.provisional = 0;
        else {
          for (let h of o)
            this.#z(h, s);
          this.#j(s);
        }
        this.#H(s.slice(0, s.provisional));
      });
    }
    #q;
    async readdir() {
      if (!this.canReaddir())
        return [];
      let t = this.children();
      if (this.calledReaddir())
        return t.slice(0, t.provisional);
      let e = this.fullpath();
      if (this.#q)
        await this.#q;
      else {
        let s = () => {};
        this.#q = new Promise((i) => s = i);
        try {
          for (let i of await this.#t.promises.readdir(e, { withFileTypes: true }))
            this.#z(i, t);
          this.#j(t);
        } catch (i) {
          this.#I(i.code), t.provisional = 0;
        }
        this.#q = undefined, s();
      }
      return t.slice(0, t.provisional);
    }
    readdirSync() {
      if (!this.canReaddir())
        return [];
      let t = this.children();
      if (this.calledReaddir())
        return t.slice(0, t.provisional);
      let e = this.fullpath();
      try {
        for (let s of this.#t.readdirSync(e, { withFileTypes: true }))
          this.#z(s, t);
        this.#j(t);
      } catch (s) {
        this.#I(s.code), t.provisional = 0;
      }
      return t.slice(0, t.provisional);
    }
    canReaddir() {
      if (this.#e & Ie)
        return false;
      let t = _ & this.#e;
      return t === L || t === U || t === X;
    }
    shouldWalk(t, e) {
      return (this.#e & U) === U && !(this.#e & Ie) && !t.has(this) && (!e || e(this));
    }
    async realpath() {
      if (this.#k)
        return this.#k;
      if (!((Lt | Nt | j) & this.#e))
        try {
          let t = await this.#t.promises.realpath(this.fullpath());
          return this.#k = this.resolve(t);
        } catch {
          this.#P();
        }
    }
    realpathSync() {
      if (this.#k)
        return this.#k;
      if (!((Lt | Nt | j) & this.#e))
        try {
          let t = this.#t.realpathSync(this.fullpath());
          return this.#k = this.resolve(t);
        } catch {
          this.#P();
        }
    }
    [Ye](t) {
      if (t === this)
        return;
      t.isCWD = false, this.isCWD = true;
      let e = new Set([]), s = [], i = this;
      for (;i && i.parent; )
        e.add(i), i.#x = s.join(this.sep), i.#A = s.join("/"), i = i.parent, s.push("..");
      for (i = t;i && i.parent && !e.has(i); )
        i.#x = undefined, i.#A = undefined, i = i.parent;
    }
  };
  Pt = class n2 extends R {
    sep = "\\";
    splitSep = Oi;
    constructor(t, e = L, s, i, r, o, h) {
      super(t, e, s, i, r, o, h);
    }
    newChild(t, e = L, s = {}) {
      return new n2(t, e, this.root, this.roots, this.nocase, this.childrenCache(), s);
    }
    getRootString(t) {
      return re.parse(t).root;
    }
    getRoot(t) {
      if (t = Ri(t.toUpperCase()), t === this.root.name)
        return this.root;
      for (let [e, s] of Object.entries(this.roots))
        if (this.sameRoot(t, e))
          return this.roots[t] = s;
      return this.roots[t] = new it(t, this).root;
    }
    sameRoot(t, e = this.root.name) {
      return t = t.toUpperCase().replace(/\//g, "\\").replace($e, "$1\\"), t === e;
    }
  };
  jt = class n3 extends R {
    splitSep = "/";
    sep = "/";
    constructor(t, e = L, s, i, r, o, h) {
      super(t, e, s, i, r, o, h);
    }
    getRootString(t) {
      return t.startsWith("/") ? "/" : "";
    }
    getRoot(t) {
      return this.root;
    }
    newChild(t, e = L, s = {}) {
      return new n3(t, e, this.root, this.roots, this.nocase, this.childrenCache(), s);
    }
  };
  It = class {
    root;
    rootPath;
    roots;
    cwd;
    #t;
    #s;
    #n;
    nocase;
    #r;
    constructor(t = process.cwd(), e, s, { nocase: i, childrenCacheSize: r = 16 * 1024, fs: o = wt } = {}) {
      this.#r = Ue(o), (t instanceof URL || t.startsWith("file://")) && (t = gi(t));
      let h = e.resolve(t);
      this.roots = Object.create(null), this.rootPath = this.parseRootPath(h), this.#t = new Wt, this.#s = new Wt, this.#n = new ne(r);
      let a = h.substring(this.rootPath.length).split(s);
      if (a.length === 1 && !a[0] && a.pop(), i === undefined)
        throw new TypeError("must provide nocase setting to PathScurryBase ctor");
      this.nocase = i, this.root = this.newRoot(this.#r), this.roots[this.rootPath] = this.root;
      let l = this.root, u = a.length - 1, c = e.sep, d = this.rootPath, f = false;
      for (let m of a) {
        let p = u--;
        l = l.child(m, { relative: new Array(p).fill("..").join(c), relativePosix: new Array(p).fill("..").join("/"), fullpath: d += (f ? "" : c) + m }), f = true;
      }
      this.cwd = l;
    }
    depth(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.depth();
    }
    childrenCache() {
      return this.#n;
    }
    resolve(...t) {
      let e = "";
      for (let r = t.length - 1;r >= 0; r--) {
        let o = t[r];
        if (!(!o || o === ".") && (e = e ? `${o}/${e}` : o, this.isAbsolute(o)))
          break;
      }
      let s = this.#t.get(e);
      if (s !== undefined)
        return s;
      let i = this.cwd.resolve(e).fullpath();
      return this.#t.set(e, i), i;
    }
    resolvePosix(...t) {
      let e = "";
      for (let r = t.length - 1;r >= 0; r--) {
        let o = t[r];
        if (!(!o || o === ".") && (e = e ? `${o}/${e}` : o, this.isAbsolute(o)))
          break;
      }
      let s = this.#s.get(e);
      if (s !== undefined)
        return s;
      let i = this.cwd.resolve(e).fullpathPosix();
      return this.#s.set(e, i), i;
    }
    relative(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.relative();
    }
    relativePosix(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.relativePosix();
    }
    basename(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.name;
    }
    dirname(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), (t.parent || t).fullpath();
    }
    async readdir(t = this.cwd, e = { withFileTypes: true }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s } = e;
      if (t.canReaddir()) {
        let i = await t.readdir();
        return s ? i : i.map((r) => r.name);
      } else
        return [];
    }
    readdirSync(t = this.cwd, e = { withFileTypes: true }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true } = e;
      return t.canReaddir() ? s ? t.readdirSync() : t.readdirSync().map((i) => i.name) : [];
    }
    async lstat(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstat();
    }
    lstatSync(t = this.cwd) {
      return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstatSync();
    }
    async readlink(t = this.cwd, { withFileTypes: e } = { withFileTypes: false }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t.withFileTypes, t = this.cwd);
      let s = await t.readlink();
      return e ? s : s?.fullpath();
    }
    readlinkSync(t = this.cwd, { withFileTypes: e } = { withFileTypes: false }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t.withFileTypes, t = this.cwd);
      let s = t.readlinkSync();
      return e ? s : s?.fullpath();
    }
    async realpath(t = this.cwd, { withFileTypes: e } = { withFileTypes: false }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t.withFileTypes, t = this.cwd);
      let s = await t.realpath();
      return e ? s : s?.fullpath();
    }
    realpathSync(t = this.cwd, { withFileTypes: e } = { withFileTypes: false }) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t.withFileTypes, t = this.cwd);
      let s = t.realpathSync();
      return e ? s : s?.fullpath();
    }
    async walk(t = this.cwd, e = {}) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true, follow: i = false, filter: r, walkFilter: o } = e, h = [];
      (!r || r(t)) && h.push(s ? t : t.fullpath());
      let a = new Set, l = (c, d) => {
        a.add(c), c.readdirCB((f, m) => {
          if (f)
            return d(f);
          let p = m.length;
          if (!p)
            return d();
          let w = () => {
            --p === 0 && d();
          };
          for (let g of m)
            (!r || r(g)) && h.push(s ? g : g.fullpath()), i && g.isSymbolicLink() ? g.realpath().then((S) => S?.isUnknown() ? S.lstat() : S).then((S) => S?.shouldWalk(a, o) ? l(S, w) : w()) : g.shouldWalk(a, o) ? l(g, w) : w();
        }, true);
      }, u = t;
      return new Promise((c, d) => {
        l(u, (f) => {
          if (f)
            return d(f);
          c(h);
        });
      });
    }
    walkSync(t = this.cwd, e = {}) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true, follow: i = false, filter: r, walkFilter: o } = e, h = [];
      (!r || r(t)) && h.push(s ? t : t.fullpath());
      let a = new Set([t]);
      for (let l of a) {
        let u = l.readdirSync();
        for (let c of u) {
          (!r || r(c)) && h.push(s ? c : c.fullpath());
          let d = c;
          if (c.isSymbolicLink()) {
            if (!(i && (d = c.realpathSync())))
              continue;
            d.isUnknown() && d.lstatSync();
          }
          d.shouldWalk(a, o) && a.add(d);
        }
      }
      return h;
    }
    [Symbol.asyncIterator]() {
      return this.iterate();
    }
    iterate(t = this.cwd, e = {}) {
      return typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd), this.stream(t, e)[Symbol.asyncIterator]();
    }
    [Symbol.iterator]() {
      return this.iterateSync();
    }
    *iterateSync(t = this.cwd, e = {}) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true, follow: i = false, filter: r, walkFilter: o } = e;
      (!r || r(t)) && (yield s ? t : t.fullpath());
      let h = new Set([t]);
      for (let a of h) {
        let l = a.readdirSync();
        for (let u of l) {
          (!r || r(u)) && (yield s ? u : u.fullpath());
          let c = u;
          if (u.isSymbolicLink()) {
            if (!(i && (c = u.realpathSync())))
              continue;
            c.isUnknown() && c.lstatSync();
          }
          c.shouldWalk(h, o) && h.add(c);
        }
      }
    }
    stream(t = this.cwd, e = {}) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true, follow: i = false, filter: r, walkFilter: o } = e, h = new V({ objectMode: true });
      (!r || r(t)) && h.write(s ? t : t.fullpath());
      let a = new Set, l = [t], u = 0, c = () => {
        let d = false;
        for (;!d; ) {
          let f = l.shift();
          if (!f) {
            u === 0 && h.end();
            return;
          }
          u++, a.add(f);
          let m = (w, g, S = false) => {
            if (w)
              return h.emit("error", w);
            if (i && !S) {
              let E = [];
              for (let y of g)
                y.isSymbolicLink() && E.push(y.realpath().then((b) => b?.isUnknown() ? b.lstat() : b));
              if (E.length) {
                Promise.all(E).then(() => m(null, g, true));
                return;
              }
            }
            for (let E of g)
              E && (!r || r(E)) && (h.write(s ? E : E.fullpath()) || (d = true));
            u--;
            for (let E of g) {
              let y = E.realpathCached() || E;
              y.shouldWalk(a, o) && l.push(y);
            }
            d && !h.flowing ? h.once("drain", c) : p || c();
          }, p = true;
          f.readdirCB(m, true), p = false;
        }
      };
      return c(), h;
    }
    streamSync(t = this.cwd, e = {}) {
      typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R || (e = t, t = this.cwd);
      let { withFileTypes: s = true, follow: i = false, filter: r, walkFilter: o } = e, h = new V({ objectMode: true }), a = new Set;
      (!r || r(t)) && h.write(s ? t : t.fullpath());
      let l = [t], u = 0, c = () => {
        let d = false;
        for (;!d; ) {
          let f = l.shift();
          if (!f) {
            u === 0 && h.end();
            return;
          }
          u++, a.add(f);
          let m = f.readdirSync();
          for (let p of m)
            (!r || r(p)) && (h.write(s ? p : p.fullpath()) || (d = true));
          u--;
          for (let p of m) {
            let w = p;
            if (p.isSymbolicLink()) {
              if (!(i && (w = p.realpathSync())))
                continue;
              w.isUnknown() && w.lstatSync();
            }
            w.shouldWalk(a, o) && l.push(w);
          }
        }
        d && !h.flowing && h.once("drain", c);
      };
      return c(), h;
    }
    chdir(t = this.cwd) {
      let e = this.cwd;
      this.cwd = typeof t == "string" ? this.cwd.resolve(t) : t, this.cwd[Ye](e);
    }
  };
  it = class extends It {
    sep = "\\";
    constructor(t = process.cwd(), e = {}) {
      let { nocase: s = true } = e;
      super(t, re, "\\", { ...e, nocase: s }), this.nocase = s;
      for (let i = this.cwd;i; i = i.parent)
        i.nocase = this.nocase;
    }
    parseRootPath(t) {
      return re.parse(t).root.toUpperCase();
    }
    newRoot(t) {
      return new Pt(this.rootPath, U, undefined, this.roots, this.nocase, this.childrenCache(), { fs: t });
    }
    isAbsolute(t) {
      return t.startsWith("/") || t.startsWith("\\") || /^[a-z]:(\/|\\)/i.test(t);
    }
  };
  rt = class extends It {
    sep = "/";
    constructor(t = process.cwd(), e = {}) {
      let { nocase: s = false } = e;
      super(t, mi, "/", { ...e, nocase: s }), this.nocase = s;
    }
    parseRootPath(t) {
      return "/";
    }
    newRoot(t) {
      return new jt(this.rootPath, U, undefined, this.roots, this.nocase, this.childrenCache(), { fs: t });
    }
    isAbsolute(t) {
      return t.startsWith("/");
    }
  };
  St = class extends rt {
    constructor(t = process.cwd(), e = {}) {
      let { nocase: s = true } = e;
      super(t, { ...e, nocase: s });
    }
  };
  Cr = process.platform === "win32" ? Pt : jt;
  Xe = process.platform === "win32" ? it : process.platform === "darwin" ? St : rt;
  Ni = Symbol.for("nodejs.util.inspect.custom");
  nt = class n4 {
    #t;
    #s;
    #n;
    length;
    #r;
    #o;
    #S;
    #w;
    #c;
    #h;
    #u = true;
    constructor(t, e, s, i) {
      if (!Di(t))
        throw new TypeError("empty pattern list");
      if (!Mi(e))
        throw new TypeError("empty glob list");
      if (e.length !== t.length)
        throw new TypeError("mismatched pattern list and glob list lengths");
      if (this.length = t.length, s < 0 || s >= this.length)
        throw new TypeError("index out of range");
      if (this.#t = t, this.#s = e, this.#n = s, this.#r = i, this.#n === 0) {
        if (this.isUNC()) {
          let [r, o, h, a, ...l] = this.#t, [u, c, d, f, ...m] = this.#s;
          l[0] === "" && (l.shift(), m.shift());
          let p = [r, o, h, a, ""].join("/"), w = [u, c, d, f, ""].join("/");
          this.#t = [p, ...l], this.#s = [w, ...m], this.length = this.#t.length;
        } else if (this.isDrive() || this.isAbsolute()) {
          let [r, ...o] = this.#t, [h, ...a] = this.#s;
          o[0] === "" && (o.shift(), a.shift());
          let l = r + "/", u = h + "/";
          this.#t = [l, ...o], this.#s = [u, ...a], this.length = this.#t.length;
        }
      }
    }
    [Ni]() {
      return "Pattern <" + this.#s.slice(this.#n).join("/") + ">";
    }
    pattern() {
      return this.#t[this.#n];
    }
    isString() {
      return typeof this.#t[this.#n] == "string";
    }
    isGlobstar() {
      return this.#t[this.#n] === A;
    }
    isRegExp() {
      return this.#t[this.#n] instanceof RegExp;
    }
    globString() {
      return this.#S = this.#S || (this.#n === 0 ? this.isAbsolute() ? this.#s[0] + this.#s.slice(1).join("/") : this.#s.join("/") : this.#s.slice(this.#n).join("/"));
    }
    hasMore() {
      return this.length > this.#n + 1;
    }
    rest() {
      return this.#o !== undefined ? this.#o : this.hasMore() ? (this.#o = new n4(this.#t, this.#s, this.#n + 1, this.#r), this.#o.#h = this.#h, this.#o.#c = this.#c, this.#o.#w = this.#w, this.#o) : this.#o = null;
    }
    isUNC() {
      let t = this.#t;
      return this.#c !== undefined ? this.#c : this.#c = this.#r === "win32" && this.#n === 0 && t[0] === "" && t[1] === "" && typeof t[2] == "string" && !!t[2] && typeof t[3] == "string" && !!t[3];
    }
    isDrive() {
      let t = this.#t;
      return this.#w !== undefined ? this.#w : this.#w = this.#r === "win32" && this.#n === 0 && this.length > 1 && typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]);
    }
    isAbsolute() {
      let t = this.#t;
      return this.#h !== undefined ? this.#h : this.#h = t[0] === "" && t.length > 1 || this.isDrive() || this.isUNC();
    }
    root() {
      let t = this.#t[0];
      return typeof t == "string" && this.isAbsolute() && this.#n === 0 ? t : "";
    }
    checkFollowGlobstar() {
      return !(this.#n === 0 || !this.isGlobstar() || !this.#u);
    }
    markFollowGlobstar() {
      return this.#n === 0 || !this.isGlobstar() || !this.#u ? false : (this.#u = false, true);
    }
  };
  _i = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux";
  xt = class extends zt {
    matches = new Set;
    constructor(t, e, s) {
      super(t, e, s);
    }
    matchEmit(t) {
      this.matches.add(t);
    }
    async walk() {
      if (this.signal?.aborted)
        throw this.signal.reason;
      return this.path.isUnknown() && await this.path.lstat(), await new Promise((t, e) => {
        this.walkCB(this.path, this.patterns, () => {
          this.signal?.aborted ? e(this.signal.reason) : t(this.matches);
        });
      }), this.matches;
    }
    walkSync() {
      if (this.signal?.aborted)
        throw this.signal.reason;
      return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => {
        if (this.signal?.aborted)
          throw this.signal.reason;
      }), this.matches;
    }
  };
  vt = class extends zt {
    results;
    constructor(t, e, s) {
      super(t, e, s), this.results = new V({ signal: this.signal, objectMode: true }), this.results.on("drain", () => this.resume()), this.results.on("resume", () => this.resume());
    }
    matchEmit(t) {
      this.results.write(t), this.results.flowing || this.pause();
    }
    stream() {
      let t = this.path;
      return t.isUnknown() ? t.lstat().then(() => {
        this.walkCB(t, this.patterns, () => this.results.end());
      }) : this.walkCB(t, this.patterns, () => this.results.end()), this.results;
    }
    streamSync() {
      return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => this.results.end()), this.results;
    }
  };
  Pi = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux";
  I = class {
    absolute;
    cwd;
    root;
    dot;
    dotRelative;
    follow;
    ignore;
    magicalBraces;
    mark;
    matchBase;
    maxDepth;
    nobrace;
    nocase;
    nodir;
    noext;
    noglobstar;
    pattern;
    platform;
    realpath;
    scurry;
    stat;
    signal;
    windowsPathsNoEscape;
    withFileTypes;
    includeChildMatches;
    opts;
    patterns;
    constructor(t, e) {
      if (!e)
        throw new TypeError("glob options required");
      if (this.withFileTypes = !!e.withFileTypes, this.signal = e.signal, this.follow = !!e.follow, this.dot = !!e.dot, this.dotRelative = !!e.dotRelative, this.nodir = !!e.nodir, this.mark = !!e.mark, e.cwd ? (e.cwd instanceof URL || e.cwd.startsWith("file://")) && (e.cwd = Wi(e.cwd)) : this.cwd = "", this.cwd = e.cwd || "", this.root = e.root, this.magicalBraces = !!e.magicalBraces, this.nobrace = !!e.nobrace, this.noext = !!e.noext, this.realpath = !!e.realpath, this.absolute = e.absolute, this.includeChildMatches = e.includeChildMatches !== false, this.noglobstar = !!e.noglobstar, this.matchBase = !!e.matchBase, this.maxDepth = typeof e.maxDepth == "number" ? e.maxDepth : 1 / 0, this.stat = !!e.stat, this.ignore = e.ignore, this.withFileTypes && this.absolute !== undefined)
        throw new Error("cannot set absolute and withFileTypes:true");
      if (typeof t == "string" && (t = [t]), this.windowsPathsNoEscape = !!e.windowsPathsNoEscape || e.allowWindowsEscape === false, this.windowsPathsNoEscape && (t = t.map((a) => a.replace(/\\/g, "/"))), this.matchBase) {
        if (e.noglobstar)
          throw new TypeError("base matching requires globstar");
        t = t.map((a) => a.includes("/") ? a : `./**/${a}`);
      }
      if (this.pattern = t, this.platform = e.platform || Pi, this.opts = { ...e, platform: this.platform }, e.scurry) {
        if (this.scurry = e.scurry, e.nocase !== undefined && e.nocase !== e.scurry.nocase)
          throw new Error("nocase option contradicts provided scurry option");
      } else {
        let a = e.platform === "win32" ? it : e.platform === "darwin" ? St : e.platform ? rt : Xe;
        this.scurry = new a(this.cwd, { nocase: e.nocase, fs: e.fs });
      }
      this.nocase = this.scurry.nocase;
      let s = this.platform === "darwin" || this.platform === "win32", i = { braceExpandMax: 1e4, ...e, dot: this.dot, matchBase: this.matchBase, nobrace: this.nobrace, nocase: this.nocase, nocaseMagicOnly: s, nocomment: true, noext: this.noext, nonegate: true, optimizationLevel: 2, platform: this.platform, windowsPathsNoEscape: this.windowsPathsNoEscape, debug: !!this.opts.debug }, r = this.pattern.map((a) => new D(a, i)), [o, h] = r.reduce((a, l) => (a[0].push(...l.set), a[1].push(...l.globParts), a), [[], []]);
      this.patterns = o.map((a, l) => {
        let u = h[l];
        if (!u)
          throw new Error("invalid pattern object");
        return new nt(a, u, 0, this.platform);
      });
    }
    async walk() {
      return [...await new xt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).walk()];
    }
    walkSync() {
      return [...new xt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).walkSync()];
    }
    stream() {
      return new vt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).stream();
    }
    streamSync() {
      return new vt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).streamSync();
    }
    iterateSync() {
      return this.streamSync()[Symbol.iterator]();
    }
    [Symbol.iterator]() {
      return this.iterateSync();
    }
    iterate() {
      return this.stream()[Symbol.asyncIterator]();
    }
    [Symbol.asyncIterator]() {
      return this.iterate();
    }
  };
  ji = Bt;
  Ii = Object.assign(Qe, { sync: Bt });
  zi = Ut;
  Bi = Object.assign(es, { sync: Ut });
  Ui = Object.assign(ts, { stream: Bt, iterate: Ut });
  Ze = Object.assign(Je, { glob: Je, globSync: ts, sync: Ui, globStream: Qe, stream: Ii, globStreamSync: Bt, streamSync: ji, globIterate: es, iterate: Bi, globIterateSync: Ut, iterateSync: zi, Glob: I, hasMagic: le, escape: tt, unescape: W });
  Ze.glob = Ze;
});

// ../../node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// bin/commands/scan.ts
var exports_scan = {};
__export(exports_scan, {
  scanCommand: () => scanCommand
});
import * as fs8 from "fs";
import * as path7 from "path";
import { execSync } from "child_process";
import { randomUUID as randomUUID2 } from "crypto";
function getStagedFiles(root) {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf8",
      cwd: root
    });
    return new Set(output.split(`
`).filter(Boolean));
  } catch {
    return new Set;
  }
}
var import_picocolors, scanCommand;
var init_scan = __esm(() => {
  init_esm();
  init_index_min();
  init_src();
  import_picocolors = __toESM(require_picocolors(), 1);
  scanCommand = new Command("scan").description("Advanced/manual: scan contract files and update the graph state.").argument("[files...]", "Specific files to scan (optional)").option("--changed", "Scan only git-staged files").option("--force", "Re-extract all files regardless of hash").option("--ci", "Machine-readable output, no colours").action(async (files, options2) => {
    const root = findProjectRoot();
    const config2 = loadConfig();
    const store = await getStore();
    await store.init();
    try {
      let filesToScan = files.length > 0 ? files : [];
      if (filesToScan.length === 0) {
        const specDir = path7.resolve(root, config2.specDir);
        const pattern = config2.filePattern ?? "**/*.contract.md";
        filesToScan = await Ze(pattern, { cwd: specDir, absolute: false });
        filesToScan = filesToScan.map((f) => path7.join(config2.specDir, f));
      }
      if (options2.changed) {
        const staged = getStagedFiles(root);
        filesToScan = filesToScan.filter((f) => {
          const abs = path7.resolve(root, f);
          const rel = path7.relative(root, abs).replace(/\\/g, "/");
          return staged.has(rel) || staged.has(f);
        });
      }
      let scanned = 0;
      let changed = 0;
      let skipped = 0;
      for (const relFile of filesToScan) {
        const absFile = path7.resolve(root, relFile);
        if (!fs8.existsSync(absFile)) {
          skipped++;
          continue;
        }
        const content = fs8.readFileSync(absFile, "utf-8");
        const result = extractFromSpecFile(relFile, content);
        if (result.warning === "no-frontmatter") {
          const msg = `\u26A0 ${relFile} has no ferret frontmatter \u2014 skipped
`;
          process.stderr.write(msg);
          skipped++;
          continue;
        }
        scanned++;
        const existingNode = await store.getNodeByFilePath(relFile);
        const fileHash = hashSchema(content);
        const nodeId = existingNode?.id ?? randomUUID2();
        const fileChanged = options2.force || !existingNode || existingNode.hash !== fileHash;
        if (!fileChanged) {
          continue;
        }
        const importIds = new Set;
        for (const contract of result.contracts) {
          const prevContract = await store.getContract(contract.id);
          let nodeStatus = "stable";
          if (prevContract && prevContract.shape_schema) {
            let prevShape = {};
            try {
              prevShape = JSON.parse(prevContract.shape_schema);
            } catch {}
            const comparison = compareSchemas(prevShape, contract.shape);
            if (comparison.classification === "breaking") {
              nodeStatus = "needs-review";
              const label = options2.ci ? "BREAKING" : import_picocolors.default.red("BREAKING");
              process.stdout.write(`  ${label}  ${contract.id} \u2014 ${comparison.reason}
`);
            } else if (comparison.classification === "non-breaking") {
              const label = options2.ci ? "NON-BREAKING" : import_picocolors.default.yellow("NON-BREAKING");
              process.stdout.write(`  ${label}  ${contract.id} \u2014 ${comparison.reason}
`);
            }
          }
          await store.upsertNode({
            id: nodeId,
            file_path: relFile,
            hash: fileHash,
            status: nodeStatus
          });
          await store.upsertContract({
            id: contract.id,
            node_id: nodeId,
            shape_hash: contract.shape_hash,
            shape_schema: JSON.stringify(contract.shape),
            type: contract.type,
            status: nodeStatus
          });
          contract.imports.forEach((importId) => importIds.add(importId));
          changed++;
        }
        await store.replaceDependenciesForSourceNode(nodeId, [...importIds]);
      }
      await writeContext(store, root);
      const summary = `${scanned} file${scanned !== 1 ? "s" : ""} scanned. ${changed} changed. ${changed} contract${changed !== 1 ? "s" : ""} updated.`;
      process.stdout.write(summary + `
`);
    } finally {
      await store.close();
    }
  });
});

// bin/commands/lint.ts
var exports_lint = {};
__export(exports_lint, {
  lintCommand: () => lintCommand
});
import * as fs9 from "fs";
import * as path8 from "path";
import { randomUUID as randomUUID3 } from "crypto";
async function restoreCommittedBaseline(store, contextPath) {
  const context2 = JSON.parse(fs9.readFileSync(contextPath, "utf-8"));
  const existingNodes = await store.getNodes();
  const nodeIdByFilePath = new Map(existingNodes.map((node) => [node.file_path, node.id]));
  const contractsByFilePath = new Map;
  for (const contract of context2.contracts) {
    if (!contract.specFile) {
      continue;
    }
    const existing = contractsByFilePath.get(contract.specFile) ?? [];
    existing.push(contract);
    contractsByFilePath.set(contract.specFile, existing);
  }
  const dependencyTargetsByFilePath = new Map;
  for (const edge of context2.edges) {
    const existing = dependencyTargetsByFilePath.get(edge.from) ?? [];
    existing.push(edge.to);
    dependencyTargetsByFilePath.set(edge.from, existing);
  }
  const allFilePaths = new Set([
    ...contractsByFilePath.keys(),
    ...dependencyTargetsByFilePath.keys()
  ]);
  for (const filePath of allFilePaths) {
    const nodeId = nodeIdByFilePath.get(filePath) ?? randomUUID3();
    const fileContracts = contractsByFilePath.get(filePath) ?? [];
    const nodeStatus = fileContracts.some((contract) => contract.status === "needs-review" || context2.needsReview.includes(contract.id)) ? "needs-review" : fileContracts.some((contract) => contract.status === "roadmap") ? "roadmap" : "stable";
    await store.upsertNode({
      id: nodeId,
      file_path: filePath,
      hash: "",
      status: nodeStatus
    });
    for (const contract of fileContracts) {
      await store.upsertContract({
        id: contract.id,
        node_id: nodeId,
        shape_hash: hashSchema(contract.shape),
        shape_schema: JSON.stringify(contract.shape ?? {}),
        type: contract.type,
        status: contract.status
      });
    }
    await store.replaceDependenciesForSourceNode(nodeId, dependencyTargetsByFilePath.get(filePath) ?? []);
  }
}
async function runScan(root, options2) {
  const { scanCommand: scanCommand2 } = await Promise.resolve().then(() => (init_scan(), exports_scan));
  const args = ["node", "scan"];
  if (options2.changed)
    args.push("--changed");
  if (options2.force)
    args.push("--force");
  const savedWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = () => true;
  try {
    await scanCommand2.parseAsync(args, { from: "node" });
  } catch {} finally {
    process.stdout.write = savedWrite;
  }
}
function renderImportSuggestions(suggestions, useColor) {
  if (suggestions.length === 0) {
    return;
  }
  const warningLabel = useColor ? import_picocolors2.default.yellow("SUGGEST") : "SUGGEST";
  process.stdout.write(`
  ferret  import suggestions

`);
  for (const suggestion of suggestions) {
    process.stdout.write(`  ${warningLabel}  ${suggestion.sourceContractId}
`);
    process.stdout.write(`  \u2514\u2500\u2500 ${suggestion.sourceFilePath}  consider importing ${suggestion.suggestedImportId} (${suggestion.confidence} confidence; ${suggestion.evidence})

`);
  }
}
function renderIntegrityViolations(integrityViolations, useColor) {
  const criticalLabel = useColor ? import_picocolors2.default.red("CRITICAL") : "CRITICAL";
  for (const violation of integrityViolations.unresolvedImports) {
    process.stdout.write(`  ${criticalLabel}  ${violation.contractId}
`);
    process.stdout.write(`  \u2514\u2500\u2500 ${violation.filePath}  unresolved import ${violation.importPath}

`);
  }
  for (const violation of integrityViolations.selfImports) {
    process.stdout.write(`  ${criticalLabel}  ${violation.contractId}
`);
    process.stdout.write(`  \u2514\u2500\u2500 ${violation.filePath}  self-import ${violation.importPath}

`);
  }
  for (const violation of integrityViolations.circularImports) {
    process.stdout.write(`  ${criticalLabel}  ${violation.contractId}
`);
    process.stdout.write(`  \u2514\u2500\u2500 ${violation.filePath}  circular import ${violation.importPath}

`);
  }
}
var import_picocolors2, lintCommand;
var init_lint = __esm(() => {
  init_esm();
  init_src();
  import_picocolors2 = __toESM(require_picocolors(), 1);
  lintCommand = new Command("lint").description("Default daily command: check and block contract drift.").option("--changed", "Scan only git-staged files before linting").option("--ci", "Machine-readable JSON output, no ANSI codes. Exit 1 on breaking drift.").option("--ci-baseline <mode>", "CI baseline strategy: committed (default) or rebuild", "committed").option("--ci-suggestions", "Include non-blocking import suggestions in --ci output").option("--force", "Re-extract all files before linting").action(async (options2) => {
    const start = performance.now();
    const root = findProjectRoot();
    const config2 = loadConfig();
    const contextPath = path8.join(root, ".ferret", "context.json");
    const store = await getStore();
    const suggestionsEnabled = config2.importSuggestions?.enabled !== false;
    const baselineMode = options2.ci ? String(options2.ciBaseline ?? "committed") : undefined;
    let committedContextSource;
    if (options2.ci) {
      if (baselineMode !== "committed" && baselineMode !== "rebuild") {
        process.stderr.write(`ferret: invalid --ci-baseline value. Use 'committed' or 'rebuild'.
`);
        process.exit(2);
      }
      if (baselineMode === "committed" && !fs9.existsSync(contextPath)) {
        process.stderr.write("ferret: CI baseline missing (.ferret/context.json). " + `Commit context.json or run with --ci-baseline rebuild.
`);
        process.exit(2);
      }
      if (baselineMode === "committed") {
        committedContextSource = fs9.readFileSync(contextPath, "utf-8");
      }
    }
    try {
      await store.init();
      if (options2.ci && baselineMode === "committed") {
        await restoreCommittedBaseline(store, contextPath);
      }
      await runScan(root, options2);
      if (committedContextSource !== undefined) {
        fs9.writeFileSync(contextPath, committedContextSource, "utf-8");
      }
      const reconciler2 = new Reconciler(store);
      const report = await reconciler2.reconcile();
      const contracts = await store.getContracts();
      const contractCount = contracts.length;
      const ms2 = Math.round(performance.now() - start);
      const hasIntegrityViolations = report.integrityViolations.unresolvedImports.length > 0 || report.integrityViolations.selfImports.length > 0 || report.integrityViolations.circularImports.length > 0;
      if (options2.ci) {
        const breaking = report.flagged.filter((f) => f.depth === 1).length;
        const nonBreaking = report.flagged.filter((f) => f.depth > 1).length;
        const output = {
          version: "2.0",
          consistent: report.consistent,
          breaking,
          nonBreaking,
          flagged: report.flagged,
          integrityViolations: report.integrityViolations,
          timestamp: report.timestamp
        };
        if (options2.ciSuggestions && suggestionsEnabled) {
          output.importSuggestions = report.importSuggestions;
        }
        process.stdout.write(JSON.stringify(output, null, 2) + `
`);
        process.exit(hasIntegrityViolations ? 2 : report.consistent ? 0 : 1);
        return;
      }
      if (hasIntegrityViolations) {
        process.stdout.write(`
  ferret  import integrity violations

`);
        renderIntegrityViolations(report.integrityViolations, true);
        process.stdout.write(`
  ${import_picocolors2.default.cyan("\u2192")} Fix import integrity before merge

`);
        process.exit(2);
        return;
      }
      if (report.consistent) {
        process.stdout.write(import_picocolors2.default.green("\u2713 ferret") + `  ${contractCount} contracts  0 drift  ${ms2}ms
`);
        if (suggestionsEnabled) {
          renderImportSuggestions(report.importSuggestions, true);
        }
        process.exit(0);
        return;
      }
      const flaggedContracts = new Map;
      for (const item of report.flagged) {
        const existing = flaggedContracts.get(item.triggeredByContractId) ?? [];
        existing.push(item);
        flaggedContracts.set(item.triggeredByContractId, existing);
      }
      process.stdout.write(`
  ferret  ${contractCount} contracts need review

`);
      for (const [contractId, affected] of flaggedContracts) {
        const contract = contracts.find((c) => c.id === contractId);
        const isBreaking = contract?.status === "needs-review";
        const label = isBreaking ? import_picocolors2.default.red("BREAKING") + `  ${contractId}` : import_picocolors2.default.yellow("NON-BREAKING") + `  ${contractId}`;
        process.stdout.write(`  ${label}
`);
        for (let i = 0;i < affected.length; i++) {
          const item = affected[i];
          const isLast = i === affected.length - 1;
          const treeChar = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
          const impact = item.impact === "direct" ? "imports this directly" : `imports this transitively (depth ${item.depth})`;
          process.stdout.write(`  ${treeChar} ${item.filePath}  ${impact}
`);
        }
        process.stdout.write(`
`);
      }
      const breakingCount = report.flagged.filter((f) => f.impact === "direct").length;
      const transitiveCount = report.flagged.filter((f) => f.impact === "transitive").length;
      process.stdout.write(`  ${breakingCount} breaking  ${transitiveCount} non-breaking
`);
      process.stdout.write(`
  ${import_picocolors2.default.cyan("\u2192")} Run ferret review to resolve

`);
      if (suggestionsEnabled) {
        renderImportSuggestions(report.importSuggestions, true);
      }
      process.exit(1);
    } catch (err) {
      if (options2.ci) {
        process.stderr.write(JSON.stringify({ error: String(err) }) + `
`);
      } else {
        process.stderr.write(`ferret: configuration error \u2014 ${err.message}
`);
      }
      process.exit(2);
    } finally {
      await store.close();
    }
  });
});

// bin/commands/extract.ts
var exports_extract = {};
__export(exports_extract, {
  extractCommand: () => extractCommand
});
import * as fs10 from "fs";
import * as path9 from "path";
function normalizeFileName(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function mapIdToContractPath(specDir, id) {
  const [namespace, ...rest] = id.split(".");
  const name = rest.join(".") || "contract";
  const fileName = `${normalizeFileName(name)}.contract.md`;
  return path9.join(specDir, namespace, fileName);
}
function parseFrontmatterId(content) {
  const match = content.match(/^\s*id:\s*([^\n\r]+)\s*$/m);
  return match ? match[1].trim() : null;
}
function normalizeSchema(value) {
  if (Array.isArray(value)) {
    return value.map((v2) => normalizeSchema(v2));
  }
  if (!isRecord(value)) {
    return value;
  }
  const out = {};
  for (const key of Object.keys(value).sort()) {
    const normalizedValue = normalizeSchema(value[key]);
    if (key === "required" && Array.isArray(normalizedValue)) {
      const asStrings = normalizedValue.map((v2) => String(v2));
      out[key] = [...new Set(asStrings)].sort();
      continue;
    }
    out[key] = normalizedValue;
  }
  return out;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function toYaml(value, indent = 0) {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0)
      return "[]";
    return value.map((item) => {
      if (isRecord(item) || Array.isArray(item)) {
        return `${pad}-
${toYaml(item, indent + 2)}`;
      }
      return `${pad}- ${String(item)}`;
    }).join(`
`);
  }
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    if (keys.length === 0)
      return "{}";
    return keys.map((key) => {
      const item = value[key];
      if (isRecord(item) || Array.isArray(item)) {
        return `${pad}${key}:
${toYaml(item, indent + 2)}`;
      }
      return `${pad}${key}: ${String(item)}`;
    }).join(`
`);
  }
  return `${pad}${String(value)}`;
}
function renderContractMarkdown(id, type, shape, sourceFile, sourceSymbol) {
  return `---
ferret:
  id: ${id}
  type: ${type}
  shape:
${toYaml(shape, 4)}
---

# ${id}

Generated by ferret extract from ${sourceFile} (${sourceSymbol}).
`;
}
var CONTRACT_ID_PATTERN, extractCommand;
var init_extract = __esm(() => {
  init_esm();
  init_index_min();
  init_src();
  CONTRACT_ID_PATTERN = /^[A-Za-z0-9_.\/-]+$/;
  extractCommand = new Command("extract").description("Deterministically scaffold .contract.md files from @ferret-contract TypeScript annotations.").option("--write", "Write generated contracts to disk (default: true)", true).action(async () => {
    const root = findProjectRoot();
    const config2 = loadConfig();
    const includes = config2.codeContracts?.include ?? ["src/**/*.ts"];
    const files = new Set;
    for (const pattern of includes) {
      const matches = await Ze(pattern, { cwd: root, absolute: false });
      for (const m of matches) {
        files.add(m.replace(/\\/g, "/"));
      }
    }
    const diagnostics = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const pathToContractId = new Map;
    for (const relFile of [...files].sort()) {
      const absFile = path9.join(root, relFile);
      const source = fs10.readFileSync(absFile, "utf-8");
      const result = extractContractsFromTypeScript(relFile, source);
      for (const d of result.diagnostics) {
        diagnostics.push(d);
        failed++;
      }
      for (const contract of result.contracts) {
        if (!CONTRACT_ID_PATTERN.test(contract.id) || !contract.id.includes(".")) {
          diagnostics.push(`${relFile} (${contract.sourceSymbol}): Invalid contract id '${contract.id}'. ` + "Use <namespace>.<name> with only letters, numbers, _, -, /, and .");
          failed++;
          continue;
        }
        const relContractPath = mapIdToContractPath(config2.specDir, contract.id);
        const absContractPath = path9.join(root, relContractPath);
        const existingMapped = pathToContractId.get(relContractPath);
        if (existingMapped && existingMapped !== contract.id) {
          diagnostics.push(`${relFile} (${contract.sourceSymbol}): Path collision. ` + `'${contract.id}' and '${existingMapped}' both map to '${relContractPath}'. ` + "Rename contract IDs to produce unique output paths.");
          failed++;
          continue;
        }
        pathToContractId.set(relContractPath, contract.id);
        fs10.mkdirSync(path9.dirname(absContractPath), { recursive: true });
        const normalizedShape = normalizeSchema(contract.shape);
        const content = renderContractMarkdown(contract.id, contract.type, normalizedShape, relFile, contract.sourceSymbol);
        if (!fs10.existsSync(absContractPath)) {
          fs10.writeFileSync(absContractPath, content, "utf-8");
          created++;
          continue;
        }
        const existing = fs10.readFileSync(absContractPath, "utf-8");
        const existingId = parseFrontmatterId(existing);
        if (existingId && existingId !== contract.id) {
          diagnostics.push(`${relFile} (${contract.sourceSymbol}): Output path '${relContractPath}' is already used by '${existingId}'. ` + `Cannot safely update with '${contract.id}'.`);
          failed++;
          continue;
        }
        if (existing === content) {
          skipped++;
          continue;
        }
        fs10.writeFileSync(absContractPath, content, "utf-8");
        updated++;
      }
    }
    process.stdout.write(`ferret extract  created=${created}  updated=${updated}  skipped=${skipped}  failed=${failed}
`);
    if (failed > 0) {
      for (const d of diagnostics) {
        process.stderr.write(`\u26A0 ${d}
`);
      }
      process.exit(1);
      return;
    }
    process.exit(0);
  });
});

// bin/commands/review.ts
var exports_review = {};
__export(exports_review, {
  reviewCommand: () => reviewCommand
});
import { randomUUID as randomUUID4 } from "crypto";
import * as readline from "readline/promises";
async function runScanQuietly(options2) {
  const { scanCommand: scanCommand2 } = await Promise.resolve().then(() => (init_scan(), exports_scan));
  const args = ["node", "scan"];
  if (options2.changed)
    args.push("--changed");
  if (options2.force)
    args.push("--force");
  const savedWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = () => true;
  try {
    await scanCommand2.parseAsync(args, { from: "node" });
  } catch {} finally {
    process.stdout.write = savedWrite;
  }
}
function buildReviewItems(reviewableContracts, nodeById, affectedByContractId) {
  return reviewableContracts.map((contract) => {
    const sourceNode = nodeById.get(contract.node_id);
    const affected = (affectedByContractId.get(contract.id) ?? []).slice().sort((a, b) => {
      if (a.impact !== b.impact) {
        return a.impact.localeCompare(b.impact);
      }
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      return a.filePath.localeCompare(b.filePath);
    });
    const direct = affected.filter((item) => item.impact === "direct");
    const transitive = affected.filter((item) => item.impact === "transitive");
    return {
      contractId: contract.id,
      sourceNodeId: contract.node_id,
      sourceFile: sourceNode?.file_path ?? contract.node_id,
      classification: contract.status === "needs-review" ? "breaking" : "non-breaking",
      affectedCount: affected.length,
      impact: {
        direct,
        transitive
      },
      recommendedAction: affected.length > 0 ? "update" : "accept",
      availableActions: ["accept", "update", "reject"]
    };
  });
}
async function selectContracts(reviewItems, options2) {
  if (options2.all) {
    return reviewItems.map((item) => item.contractId);
  }
  if (options2.contract) {
    const requested = options2.contract.split(",").map((item) => item.trim()).filter(Boolean);
    return [...new Set(requested)];
  }
  if (reviewItems.length === 1) {
    return [reviewItems[0].contractId];
  }
  if (options2.json) {
    return [];
  }
  process.stdout.write(`
  REVIEW ITEMS
`);
  reviewItems.forEach((item, index) => {
    process.stdout.write(`  ${index + 1}. ${item.contractId}  ${item.sourceFile}  ${item.affectedCount} impacted file${item.affectedCount === 1 ? "" : "s"}
`);
  });
  process.stdout.write(`  all. review every current drift item
`);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  try {
    const answer = (await rl.question(`
Select review item number(s) or 'all': `)).trim();
    return parseSelection(answer, reviewItems);
  } finally {
    rl.close();
  }
}
function parseSelection(answer, reviewItems) {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  if (normalized === "all") {
    return reviewItems.map((item) => item.contractId);
  }
  const seen = new Set;
  const selected = [];
  for (const token of normalized.split(",").map((item) => item.trim())) {
    const selection = Number.parseInt(token, 10);
    if (!Number.isFinite(selection) || selection < 1 || selection > reviewItems.length) {
      return [];
    }
    const contractId = reviewItems[selection - 1].contractId;
    if (!seen.has(contractId)) {
      seen.add(contractId);
      selected.push(contractId);
    }
  }
  return selected;
}
async function selectAction(requestedAction, suppressPromptOutput = false) {
  if (requestedAction) {
    const normalized = normalizeAction(requestedAction);
    return normalized;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: suppressPromptOutput ? undefined : process.stdout
  });
  try {
    const answer = (await rl.question(`
Select action [a]ccept, [u]pdate, [r]eject: `)).trim();
    return normalizeAction(answer);
  } finally {
    rl.close();
  }
}
function normalizeAction(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "a" || normalized === "accept")
    return "accept";
  if (normalized === "u" || normalized === "update")
    return "update";
  if (normalized === "r" || normalized === "reject")
    return "reject";
  return;
}
async function applyReviewAction(store, root, contracts, selectedItems, action) {
  if (action === "accept") {
    const nodeIdsToClear = new Set;
    for (const item of selectedItems) {
      nodeIdsToClear.add(item.sourceNodeId);
      item.impact.direct.forEach((impact) => nodeIdsToClear.add(impact.nodeId));
      item.impact.transitive.forEach((impact) => nodeIdsToClear.add(impact.nodeId));
    }
    for (const nodeId of nodeIdsToClear) {
      await store.updateNodeStatus(nodeId, "stable");
    }
    const clearedContracts = contracts.filter((contract) => nodeIdsToClear.has(contract.node_id));
    for (const contract of clearedContracts) {
      await store.upsertContract({ ...contract, status: "stable" });
    }
    await writeContext(store, root);
    return {
      repoBlocked: false,
      clearedContracts: clearedContracts.map((contract) => contract.id).sort(),
      clearedFiles: [
        ...new Set(clearedContracts.map((contract) => {
          const item = selectedItems.find((entry) => entry.sourceNodeId === contract.node_id);
          return item?.sourceFile ?? contract.node_id;
        }))
      ].sort(),
      blockedContracts: [],
      blockedFiles: []
    };
  }
  await writeContext(store, root);
  return {
    repoBlocked: true,
    clearedContracts: [],
    clearedFiles: [],
    blockedContracts: selectedItems.map((item) => item.contractId).sort(),
    blockedFiles: [
      ...new Set(selectedItems.flatMap((item) => [
        item.sourceFile,
        ...item.impact.direct.map((impact) => impact.filePath),
        ...item.impact.transitive.map((impact) => impact.filePath)
      ]))
    ].sort()
  };
}
function renderReviewContext(item) {
  process.stdout.write(`
  ferret review

`);
  process.stdout.write(`  DRIFT
`);
  process.stdout.write(`  contract: ${item.contractId}
`);
  process.stdout.write(`  source: ${item.sourceFile}
`);
  process.stdout.write(`  classification: ${item.classification}
`);
  process.stdout.write(`  affected: ${item.affectedCount} file${item.affectedCount === 1 ? "" : "s"}
`);
  process.stdout.write(`  recommended-action: ${item.recommendedAction}

`);
  process.stdout.write(`  DIRECT IMPACT
`);
  renderImpactGroup(item.impact.direct);
  process.stdout.write(`
  TRANSITIVE IMPACT
`);
  renderImpactGroup(item.impact.transitive);
  process.stdout.write(`
`);
  process.stdout.write(`  RESOLUTION OPTIONS
`);
  process.stdout.write(`  [a]ccept  mark reviewed items stable and continue
`);
  process.stdout.write(`  [u]pdate  print copy-paste context for downstream updates
`);
  process.stdout.write(`  [r]eject  keep repo blocked until upstream is fixed
`);
}
function renderImpactGroup(items) {
  if (items.length === 0) {
    process.stdout.write(`  \u2514\u2500\u2500 none
`);
    return;
  }
  items.forEach((item, index) => {
    const treeChar = index === items.length - 1 ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
    const impact = item.impact === "direct" ? "imports this directly" : `imports this transitively (depth ${item.depth})`;
    process.stdout.write(`  ${treeChar} ${item.filePath}  ${impact}
`);
  });
}
function renderCopyPasteContext(item, mode) {
  process.stdout.write(`
  COPY-PASTE CONTEXT
`);
  process.stdout.write(`  contract: ${item.contractId}
`);
  process.stdout.write(`  source: ${item.sourceFile}
`);
  process.stdout.write(`  requested-action: ${mode}
`);
  process.stdout.write(`  affected-files: ${item.affectedCount}
`);
  [...item.impact.direct, ...item.impact.transitive].forEach((impact) => {
    process.stdout.write(`  - ${impact.filePath} (${impact.impact === "direct" ? "direct" : `transitive depth ${impact.depth}`})
`);
  });
  process.stdout.write(`  next-step: ${mode === "update" ? "Update downstream files and re-run ferret lint" : "Fix or revert the upstream change and re-run ferret lint"}

`);
}
function writeJson(payload) {
  process.stdout.write(JSON.stringify(payload, null, 2) + `
`);
}
function defaultResolutionNote(action, contractId) {
  if (action === "accept") {
    return `Accepted review for ${contractId}.`;
  }
  if (action === "update") {
    return `Update requested for downstream dependents of ${contractId}.`;
  }
  return `Rejected upstream drift for ${contractId}.`;
}
var import_picocolors3, reviewCommand;
var init_review = __esm(() => {
  init_esm();
  init_src();
  import_picocolors3 = __toESM(require_picocolors(), 1);
  reviewCommand = new Command("review").description("Guided review flow for contract drift.").option("--contract <ids>", "Specific contract id or comma-separated contract ids to review").option("--all", "Select all current review items").option("--action <accept|update|reject>", "Review action to apply").option("--json", "Emit structured review output to stdout").option("--note <text>", "Optional review note to persist in reconciliation log").action(async (options2) => {
    const root = findProjectRoot();
    const store = await getStore();
    try {
      await store.init();
      await runScanQuietly(options2);
      const reconciler2 = new Reconciler(store);
      const report = await reconciler2.reconcile();
      const hasIntegrityViolations = report.integrityViolations.unresolvedImports.length > 0 || report.integrityViolations.selfImports.length > 0 || report.integrityViolations.circularImports.length > 0;
      if (hasIntegrityViolations) {
        process.stderr.write(`ferret review: fix import integrity violations before reviewing drift.
`);
        process.exitCode = 2;
        return;
      }
      const nodes = await store.getNodes();
      const contracts = await store.getContracts();
      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      const affectedByContractId = new Map;
      for (const item of report.flagged) {
        const affected = affectedByContractId.get(item.triggeredByContractId) ?? [];
        affected.push(item);
        affectedByContractId.set(item.triggeredByContractId, affected);
      }
      const reviewableContracts = contracts.filter((contract) => contract.status === "needs-review" || affectedByContractId.has(contract.id)).sort((left, right) => left.id.localeCompare(right.id));
      const reviewItems = buildReviewItems(reviewableContracts, nodeById, affectedByContractId);
      if (reviewItems.length === 0) {
        if (options2.json) {
          writeJson({
            version: "2.0",
            reviewable: [],
            selected: [],
            action: null,
            result: null
          });
        } else {
          process.stdout.write(`${import_picocolors3.default.green("\u2713 ferret review")}  0 items need review
`);
        }
        process.exitCode = 0;
        return;
      }
      const selectedContractIds = await selectContracts(reviewItems, {
        contract: options2.contract,
        all: options2.all,
        json: options2.json
      });
      if (options2.json && !options2.action && selectedContractIds.length === 0) {
        writeJson({
          version: "2.0",
          reviewable: reviewItems,
          selected: [],
          action: null,
          result: null
        });
        process.exitCode = 0;
        return;
      }
      if (selectedContractIds.length === 0) {
        process.stderr.write(`ferret review: no valid review items selected. Use --contract, --all, or choose from the prompt.
`);
        process.exitCode = 2;
        return;
      }
      const selectedItems = reviewItems.filter((item) => selectedContractIds.includes(item.contractId));
      if (selectedItems.length !== selectedContractIds.length) {
        process.stderr.write(`ferret review: one or more selected contracts are not in the current drift set.
`);
        process.exitCode = 2;
        return;
      }
      if (!options2.json) {
        selectedItems.forEach((item, index) => {
          if (index > 0) {
            process.stdout.write(`
`);
          }
          renderReviewContext(item);
        });
      }
      const action = await selectAction(options2.action, Boolean(options2.json));
      if (!action) {
        process.stderr.write(`ferret review: no action selected. Use --action in non-interactive mode.
`);
        process.exitCode = 2;
        return;
      }
      const note = String(options2.note ?? "").trim();
      for (const item of selectedItems) {
        await store.insertReconciliationLog({
          id: randomUUID4(),
          node_id: item.sourceNodeId,
          triggered_by: item.contractId,
          resolved_by: action,
          resolution_notes: note || defaultResolutionNote(action, item.contractId)
        });
      }
      const resultSummary = await applyReviewAction(store, root, contracts, selectedItems, action);
      if (options2.json) {
        writeJson({
          version: "2.0",
          reviewable: selectedItems,
          selected: selectedItems.map((item) => item.contractId),
          action,
          result: resultSummary
        });
        process.exitCode = 0;
        return;
      }
      if (action === "accept") {
        process.stdout.write(`ACCEPTED  ${selectedItems.map((item) => item.contractId).join(", ")}  review recorded, drift cleared
`);
        process.exitCode = 0;
        return;
      }
      selectedItems.forEach((item) => renderCopyPasteContext(item, action));
      process.stdout.write(`${action === "update" ? "UPDATE" : "REJECT"}  ${selectedItems.map((item) => item.contractId).join(", ")}  repo remains blocked until ${action === "update" ? "dependents are updated" : "upstream is fixed"}
`);
      process.exitCode = 0;
      return;
    } finally {
      await store.close();
    }
  });
});

// bin/ferret.ts
init_esm();
var VERSION = "0.1.0";
async function main() {
  if (process.argv.includes("--version") || process.argv.includes("-V")) {
    process.stdout.write(`${VERSION}
`);
    return;
  }
  const program2 = new Command;
  program2.name("ferret").description("SpecFerret keeps your specs honest.").version(VERSION);
  const [
    { initCommand: initCommand2 },
    { scanCommand: scanCommand2 },
    { lintCommand: lintCommand2 },
    { extractCommand: extractCommand2 },
    { reviewCommand: reviewCommand2 }
  ] = await Promise.all([
    Promise.resolve().then(() => (init_init(), exports_init)),
    Promise.resolve().then(() => (init_scan(), exports_scan)),
    Promise.resolve().then(() => (init_lint(), exports_lint)),
    Promise.resolve().then(() => (init_extract(), exports_extract)),
    Promise.resolve().then(() => (init_review(), exports_review))
  ]);
  program2.addCommand(initCommand2);
  program2.addCommand(scanCommand2);
  program2.addCommand(lintCommand2);
  program2.addCommand(extractCommand2);
  program2.addCommand(reviewCommand2);
  await program2.parseAsync(process.argv);
}
main();
