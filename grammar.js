/**
 * @file Grammar for the Quick Backend (QBE) intermediate representation
 * @author Marcus Nilsson <marcus.nilsson@genarp.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "qbe",

  rules: {
    source_file: $ => repeat(choice(
      $.TYPEDEF,
      $.DATADEF,
      $.FUNCDEF,
      $.COMMENT,
    )),

    TYPEDEF: $ => choice(
      $._regular_type,
      $._union_type,
      $._opaque_type
    ),
    _regular_type: $ => seq(
      'type',
      $.AGGREGATE,
      '=',
      optional($._alignment),
      '{',
      $._types,
      '}',
    ),

    FUNCDEF: $ => seq(
      $.LINKAGE,
      'function',
      optional($.ABITY),
      $.GLOBAL,
      '(',
      optional($._funcdef_params),
      ')',
      '{',
      repeat1($.BLOCK),
      '}'
    ),

    _funcdef_params: $ => seq(
      $._funcdef_param,
      repeat(seq(',', $._funcdef_param)),
      optional(",")
    ),

    _funcdef_param: $ => choice(
      '...',
      seq($.ABITY, $.LOCAL),
      seq('env', $.LOCAL),
    ),

    BLOCK: $ => seq(
      $.LABEL,
      repeat(
        choice(
          $.INST,
          $.COMMENT,
        )
      ),
    ),

    INST: $ => seq(
      optional(seq($.LOCAL, '=', $.ABITY)),
      choice(
        $.NORMAL_INST,
        $.CALL_INST,
      ),
      $._newline
    ),

    CALL_INST: $ => seq(
      'call',
      choice($.LOCAL, $.GLOBAL),
      '(',
      optional($._call_params),
      ')',
    ),

    _call_params: $ => seq(
      $._call_param,
      repeat(seq(',', $._call_param)),
      optional(",")
    ),

    _call_param: $ => choice(
      '...',
      seq($.ABITY, choice($.VAL, $.GLOBAL)),
    ),

    NORMAL_INST: $ => seq(
      field('name', $.IDENT),
      optional($._inst_args),
    ),

    _inst_args: $ => seq(
      $._inst_arg,
      repeat(seq(',', $._inst_arg)),
      optional(",")
    ),

    _inst_arg: $ => choice(
      $.LABEL,
      $.VAL,
      seq($.LABEL, $.VAL),
    ),

    LOCAL: $ => seq('%', field('name', $.IDENT)),
    LABEL: $ => seq('@', field('name', $.IDENT)),
    GLOBAL: $ => seq('$', field('name', $.IDENT)),
    AGGREGATE: $ => seq(':', field('name', $.IDENT)),

    ABITY: $ => choice($.BASETY, $.SUBWTY, seq(":", $.IDENT)),

    _union_type: $ => seq(
      'type',
      $.AGGREGATE,
      '=',
      optional($._alignment),
      '{',
      repeat1(seq('{', $._types, '}')),
      '}',
    ),

    _opaque_type: $ => seq(
      'type',
      $.AGGREGATE,
      '=',
      $._alignment,
      '{',
      $.NUMBER,
      '}',
    ),

    _types: $ => seq(
      seq($.SUBTY, optional($.NUMBER)),
      repeat(seq(',', $.SUBTY, optional($.NUMBER))),
      optional(','),
    ),

    SUBTY: $ => choice(
      $.AGGREGATE,
      $.EXTTY
    ),
    SUBWTY: $ => choice(
      'sb',
      'ub',
      'sh',
      'uh'
    ),

    EXTTY: $ => choice(
      $.BASETY,
      'b',
      'h'
    ),

    BASETY: $ => choice('w', 'l', 's', 'd'),

    DATADEF: $ => seq(
      optional($.LINKAGE),
      'data',
      $.GLOBAL,
      '=',
      optional($._alignment),
      '{',
      $._datadef_data,
      repeat(seq(',', $._datadef_data)),
      optional(','),
      '}'
    ),

    DATAITEM: $ => choice(
      seq($.GLOBAL, optional(seq('+', $.NUMBER))),
      $.STRING,
      $._dataitem_const,
    ),

    _dataitem_const: $ => choice(
      seq(optional('-'), $.NUMBER),
      seq('s_', $.FP),
      seq('d_', $.FP),
    ),

    DYNCONST: $ => choice(
      $._dataitem_const,
      seq('thread', $.GLOBAL),
    ),

    VAL: $ => choice(
      $.DYNCONST,
      $.LOCAL,
    ),

    _datadef_data: $ => choice(
      seq($.EXTTY, repeat1($.DATAITEM)),
      seq('z', $.NUMBER)
    ),

    LINKAGE: $ => choice(
      'export',
      'thread',
      seq('section', $.SECNAME, optional($.SECFLAGS)),
    ),

    SECNAME: $ => $.STRING,
    SECFLAGS: $ => $.STRING,

    _alignment: $ => seq('align', field('alignment', $.NUMBER)),
    COMMENT: $ => seq('#', /.*/),

    STRING: $ => /"[^"]*"/,
    NUMBER: $ => /[0-9]+/,
    FP: $ => /[0-9]+\.?[0-9]*/,
    IDENT: $ => /[a-zA-Z\.0-9_]+/,
    _newline: $ => /(\r\n|\r|\n)/,
  }
});
