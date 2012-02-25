/**
 * Copyright 2008 Google Inc.  All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Automated client-side form validation.
 * Please see http://code.google.com/p/valid-forms/ for usage.
 * @author erichiggins@google.com (Eric Higgins)
 */


/**
 * {Object} forms Container object for form related scripts.
 */
goog.provide('forms');
goog.provide('forms.Validation');

/**
 * {Object} goog.forms.Validation Automated form validation
 * @param {HTMLFormElement} form HTML form element to be validated.
 * @constructor
 * @export
 */
forms.Validation = function(form) {
  /**
   * Set the form element. Useful if you want to use other methods before
   * isValid.
   */
  this.form_ = form || this.form_;
  if (this.form_) {
    this.form_.onsubmit = function(obj) {
      return function() { return obj.isValid(); };
    }(this);
  }
  this.validationExp = {};
  // Alphabet characters only.
  this.validationExp['alpha'] = new RegExp('^[a-zA-Z\\u00c0-\\u00ff]+$');
  // AlphaNumeric characters only.
  this.validationExp['alphanum'] = new RegExp(
      '^[a-zA-Z0-9\\u00c0-\\u00ff]+$');
  // Domain expression (e.g.  example.com, www.example.com).
  this.validationExp['domain'] = new RegExp(
      '^(?:[a-zA-Z0-9_-]*.)*(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+' +
      '\.(?:' + this.topLevelDomains_ + ')$');
  // Email local piece expression (everything before the @).
  this.validationExp['email-local'] = new RegExp('^.{1,255}$');
  // Numeric characters only.
  this.validationExp['num'] = new RegExp('^\\d+$');
  // Phone (e.g. 1-555-555-5555, 555.555.5555, +1-555-555-5555, 5555555555).
  this.validationExp['phone'] = new RegExp('^[0-9.()+ -]{10,25}$');
  /**
   * URL expression (e.g. https://www.example.com, http://example.com).
   * TODO(erichiggins): Use domain regexp, but allow all parameters/hashes.
   * http://en.wikipedia.org/wiki/URI_scheme#Generic_syntax
   */
  this.validationExp['url'] = new RegExp('^https?:\/\/.+$');

  this.fileTypes = {};
  /**
   * Audio files.
   * @type {Array}
   */
  this.fileTypes['audio'] = ['mp3', 'mp4', 'flac', 'ogg', 'wma', 'wav'];
  /**
   * Image files.
   * @type {Array}
   */
  this.fileTypes['image'] = ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'tif',
      'raw'];
  /**
   * PDF files.
   * @type {Array}
   */
  this.fileTypes['pdf'] = ['pdf'];
  /**
   * Text files.
   * @type {Array}
   */
  this.fileTypes['text'] = ['txt'];
  /**
   * HTML files.
   * @type {Array}
   */
  this.fileTypes['html'] = ['html', 'htm'];
  /**
   * Video files.
   * @type {Array}
   */
  this.fileTypes['video'] = ['mov', 'mpeg', 'mpg', 'avi', 'ogm', 'wmv'];
};


/**
 * Anchor tag to go to when an error is raised. Defaults to first error message
 * id. This is not used if jump is set to false.
 * @type {string}
 */
forms.Validation.prototype.anchor = '';
/**
 * Tag used for error messages. Using this can increase performance.
 * @type {string|null}
 */
forms.Validation.prototype.errorTag = null;
/**
 * Class name used for error messages.
 * @type {string}
 */
forms.Validation.prototype.errorClass = 'error';
/**
 * Display value for error messages when they are displayed. Use block or
 * inline.
 * @type {string}
 */
forms.Validation.prototype.errorDisplay = 'block';
/**
 * Form element to validate.
 * @type {HTMLFormElement}
 * @private
 */
forms.Validation.prototype.form_ = null;
/**
 * Enables accessibility option of taking the user to the first error message
 * on the page when validation fails. Useful for very long forms.
 * @type {boolean}
 */
forms.Validation.prototype.jump = false;
/**
 * Class name used to signal multiple error messages.
 * @type {string}
 */
forms.Validation.prototype.multiClass = 'm';
/**
 * Prefix namespace used for validation class names.
 * @type {string}
 */
forms.Validation.prototype.prefix = 'v-';
/**
 * Suffix used for error message IDs.
 * @type {string}
 */
forms.Validation.prototype.suffix = '-err';
/**
 * Filetypes and related extensions used in file upload validation.
 * @type {Object}
 */
forms.Validation.prototype.fileTypes = {};
/**
 * Form validation expressions for complex strings.
 * @type {Object}
 */
forms.Validation.prototype.validationExp = {};

/**
 * Function to check if a given form passes all defined validation methods.
 * @this forms.Validation
 * @param {HTMLFormElement} form HTML form element to be validated.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isValid = function(form) {
  this.form_ = form || this.form_;
  this.hideAllErrors();

  var valid = true;
  var firstErrorId = '';
  var lastFailedField = '';
  var errorMsgs = this.getElementsByClass_([this.errorClass, this.prefix],
      this.form_, this.errorTag);

  // Loop through all error message tags, and check matching form tag.
  for (var i = 0, len = errorMsgs.length; i < len; i++) {
    var display = false;
    var errorMsg = errorMsgs[i];
    var formElementId = this.getFieldName_(errorMsg.id, errorMsg.className);

    if (formElementId && formElementId != lastFailedField) {
      if (!this.check_(formElementId, errorMsg.className)) {
        firstErrorId = valid ? errorMsg.id: firstErrorId;
        valid = false;
        display = true;
        lastFailedField = formElementId;
      }
      this.display_(errorMsg, display);
    }
  }

  if (!valid) {
    /**
     * If set, go to the defined.anchor, otherwise to the first error.
     */
    if (this.jump) {
      window.location = this.anchor.length ? this.anchor : '#' +
          firstErrorId;
    }
    /**
     * Change focus to the relevant field.
     */
    this.focus_(this.formGet_(this.getFieldName_(firstErrorId)));
  }
  return valid;
};

/**
 * Hides all error messages.
 * @this forms.Validation
 */
forms.Validation.prototype.hideAllErrors = function() {
  var elements = this.getElementsByClass_([this.errorClass, this.prefix],
      this.form_, this.errorTag);

  for (var i = 0, len = elements.length; i < len; i++) {
    this.display_(elements[i], false);
  }
};

/**
 * Setter for nearly anything?
 * Might want to ditch this whole thing.
 * @private
 * @this forms.Validation
 * @param {string|Array} property Name of a property.
 * @param {*} value Value to set to the property.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.set_ = function(property,
                                                                value) {
      switch (typeof property) {
        case 'string':
          this[property] = value;
          break;
        case 'object':
          for (var p in property) {
            this[p] = property[p];
          }
          break;
        default:
          return false;
      }
      return true;
    };

/**
 * Give focus to the element.  In case of an array of elements, give focus to
 * the first index of the array.
 * @private
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field Name of the form field to give focus to.
 */
forms.Validation.prototype.focus_ = function(field) {
  try {
    field.focus();
  } catch (err) {
    field[0].focus();
  }
};

/**
 * Strip the suffix from the error class and return the form input name.
 * @private
 * @this forms.Validation
 * @param {string} errorId HTML ID of the error field.
 * @param {string=} className Class string of the error field.
 * @return {string} Field name.
 */
forms.Validation.prototype.getFieldName_ = function(
    errorId, className) {
  className = className || '';
  var field = errorId.substring(0, (errorId.length - this.suffix.length));
  var classArr = className.split(' ');
  var multiClass = this.prefix + this.multiClass;

  /**
   * Multiple error messages can be implemented like this, where v-m is the
   * multiClass. If multiClass is present, then everything after, and including,
   * the last hyphen (-) will be removed in order to find the field name.
   * <ins id="serial-0-err" class="v-error v-m">Please enter a serial.</ins>
   * <ins id="serial-1-err" class="v-error v-m v-caps">All caps please.</ins>
   * <ins id="serial-2-err" class="v-error v-m v-alphanum">Alphanum.</ins>
   * <label for="serial">Serial Number</label>
   * <input id="serial" name="serial" type="text">
   */
  for (var i = 0; i < classArr.length; i++) {
    if (classArr[i] == multiClass) {
      field = field.substring(0, field.lastIndexOf('-'));
      break;
    }
  }
  return field;
};

/**
 * Split the error class name into identifier and args.
 * @private
 * @this forms.Validation
 * @param {string} className Individual class name.
 * @return {Object} Validation identifier and arguments.
 */
forms.Validation.prototype.splitClassName_ = function(
    className) {
  /**
   * Remove the prefix from className, if any.
   */
  className = (className.indexOf(this.prefix) >= 0) ?
      className.substring(this.prefix.length): className;

  var classArgs = className.split('-');
  var args = {'method': '', 'args': []};
  /**
   * Loop the classArgs array and remove any empty elements.
   */
  var cleanArgs = [];
  for (var i = 0, len = classArgs.length; i < len; i++) {
    if (classArgs[i].length) {
      cleanArgs.push(classArgs[i]);
    }
  }

  switch (cleanArgs.length) {
    case 0:
      args['method'] = '';
      break;
    case 1:
      args['method'] = cleanArgs[0];
      break;
    default:
      args['method'] = cleanArgs[0];
      for (var i = 1, len = cleanArgs.length; i < len; i++) {
        args['args'].push(cleanArgs[i]);
      }
      break;
  }
  return args;
};

/**
 * Class names, without prefix
 * len-0-10
 * email
 * url
 * @private
 * @this forms.Validation
 * @param {string} className Class name used to define validation method.
 * @param {string} value Input field value to be validated.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.validateHandler_ = function(
    className, value) {
  /**
   * {Array} classArr List of class names from the element.
   */
  var classArr = className.split(' ');
  var valid;

  for (var i = 0, className; className = classArr[i]; i++) {
    valid = true;
    if (className.substring(0, this.prefix.length) === this.prefix) {
      var classNameParts = this.splitClassName_(className);

      switch (classNameParts['method']) {
        case 'email':
          valid = this.isValidEmail_(value);
          break;
        case 'file':
        case 'upload':
          // Check the last character to see if it is a double-quote
          if (value.charAt(value.length - 1) === '"') {
            value = value.substring(0, value.length - 2)
          }
          valid = this.isValidFileExtension_(value, classNameParts['args'][0]);
          break;
        case 'len':
          if (classNameParts['args'].length === 1) {
            classNameParts['args'].push(null);
          }
          valid = this.isValidLength_(value, classNameParts['args'][0],
              classNameParts['args'][1]);
          break;
        case 'match':
        case 'eq':
        case 'equal':
          valid = this.isEqual_(value,
                                this.formGet_(classNameParts['args'][0]).value);
          break;
        /**
         * Added to help with backward-compatibility/migration.
         * change class="error" to class="v-error" and use .v-error in your
         * style sheet.
         */
        case 'required':
        case 'error':
        case this.errorClass:
          valid = this.hasValue_(value);
          break;
        /**
         * Don't validate against the multiClass name.
         */
        case this.multiClass:
          break;
        /**
         * The default case covers any custom validation expressions that may
         * have been defined in the constructor, or by the developer.
         */
        default:
          valid = this.isValidRegExp_(value, classNameParts['method']);
          break;
      }
    }
    if (!valid) {
      return false;
    }
  }
  return true;
};

/**
 * Checks if two values are equal.
 * @private
 * @param {string} firstValue First value to compare.
 * @param {string} secondValue Second value to compare.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isEqual_ = function(
    firstValue, secondValue) {
  return firstValue === secondValue;
};

/**
 * Check email address for validity.  This is a complex procedure because the
 * Regular Expression engine in JavaScript doesn't have the ability to do
 * negative lookbehind assertions, which are required for a single expression
 * to properly validate the local-part of an email address.
 * @private
 * @this forms.Validation
 * @param {string} value Email address to validate.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isValidEmail_ = function(
    value) {
    /**
     * Split by last @, if any.
     * send domain part to domain regex
     * check local part
     */
      if (value.indexOf('@') === -1) {
        return false;
      }
      var sep = value.lastIndexOf('@');

      /**
       * Check the domain, using the domain regex
       */
      if (!this.isValidRegExp_(value.substring(sep + 1), 'domain')) {
        return false;
      }
      var local = value.substring(0, sep);

      /**
       * Check the local part
       */
      return this.isValidRegExp_(local, 'email-local');
    };

/**
 * Check if the length of a string is between the two boundaries.
 * min must be less than or equal to max.
 * @private
 * @param {string} value Value being tested.
 * @param {number} min Minmum string length.
 * @param {number} max Maximum string length.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype
    .isValidLength_ = function(value, min, max) {
  if (!max) {
    return value.length >= min;
  }

  return min <= max && value.length >= min && value.length <= max;
};

/**
 * Check the value against the expression.
 * @private
 * @this forms.Validation
 * @param {string} value Value to test against expression.
 * @param {string} expression Expression index key to test on value.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isValidRegExp_ = function(
    value, expression) {
  return this.validationExp[expression].test(value);
};

/**
 * Check for file extension validity.
 * @private
 * @this forms.Validation
 * @param {string} value Filename to check extension of.
 * @param {string} filetype Filetype index key to compare against filename.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype
    .isValidFileExtension_ = function(value, filetype) {
  value = this.getFileExtension_(value).toLowerCase();
  filetype = this.fileTypes[filetype];

  for (var i = 0, len = filetype.length; i < len; i++) {
    if (filetype[i] === value) {
      return true;
    }
  }
  return false;
};

/**
 * Get the file extension from a file name.
 * @private
 * @param {string} value Filename.
 * @return {string} File extension.
 */
forms.Validation.prototype.getFileExtension_ = function(
    value) {
  return value.substring(value.lastIndexOf('.') + 1);
};

/**
 * Determines the form field type, then calls the appropriate check function.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the form field.
 * @param {string} className Class name used to determine validation type.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.check_ = function(
    fieldName, className) {
  var type = this.formGet_(fieldName).type;

  /**
   * This deals with checkbox[] and radio[] arrays.
   */
  type = (typeof type === 'undefined') ? this.formGet_(fieldName)[0].type :
      type;

  switch (type) {
    case 'checkbox':
      return this.checkCheckbox_(fieldName);
    case 'text':
    case 'password':
      return this.checkText_(fieldName, className);
    case 'select-one':
    case 'select-multiple':
      return this.checkSelect_(fieldName);
    case 'textarea':
      return this.checkTextArea_(fieldName);
    case 'file':
      return this.checkFileUpload_(fieldName, className);
    case 'radio':
      return this.checkRadio_(fieldName);
    case 'button':
    case 'hidden':
    case 'image':
    case 'reset':
    case 'submit':
    default:
      return true;
  }
};

/**
 * Checks if a field has been disabled.
 * @private
 * @this forms.Validation
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field HTML form field to check.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isDisabled_ = function(field) {
  return (field.disabled == 'disabled' || field.disabled);
};

/**
 * Checks if a field is read-only.
 * @private
 * @this forms.Validation
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field HTML form field to check.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.isReadOnly_ = function(field) {
  return (field.readonly === 'readonly' || field.readonly);
};

/**
 * Determines if a field value is blank.
 * @private
 * @param {string} value The value of a form field.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.hasValue_ = function(value) {
  return !!value.length;
};

/**
 * Determines if a file upload field is blank.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the file upload field.
 * @param {string} className Name of the classes.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkFileUpload_ = function(
    fieldName, className) {
  var field = this.formGet_(fieldName);

  return this.isDisabled_(field) ||
      this.validateHandler_(className, field.value);
};

/**
 * Determines if a checkbox is checked or not.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the checkbox field.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkCheckbox_ = function(
    fieldName) {
  var field = this.formGet_(fieldName);

  if (field.length) {
    for (var i = 0, len = field.length; i < len; i++) {
      if (!this.isDisabled_(field[i]) && field[i].checked) {
        return true;
      }
    }
    return false;
  } else {
    return this.isDisabled_(field) || field.checked;
  }
};

/**
 * Determines if a radio group is checked or not.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the radio group.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkRadio_ = function(
    fieldName) {
  var radioGroup = this.formGet_(fieldName);

  for (var i = 0; i < radioGroup.length; i++) {
    if (radioGroup[i].checked) {
      return true;
    }
  }
  return false;
};

/**
 * Determines if a text input has been left blank.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the text input field.
 * @param {string} className Name of the classes.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkText_ = function(
    fieldName, className) {
  var field = this.formGet_(fieldName);

  return (this.isDisabled_(field) || this.isReadOnly_(field)) ||
      this.validateHandler_(className, field.value);
};

/**
 * Determines if the user has chosen a selection from a dropdown.
 * The first and default selected option of the dropdown should use
 * value="" in order for this to work. Typically, the option will display
 * "Please select" to the user.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the dropdown field.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkSelect_ = function(
    fieldName) {
  var field = this.formGet_(fieldName);

  return this.isDisabled_(field) || this.hasValue_(
      field.options[field.selectedIndex].value);
};

/**
 * Determines if a textarea has been left blank.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the textarea.
 * @return {boolean} Boolean.
 */
forms.Validation.prototype.checkTextArea_ = function(
    fieldName) {
  var field = this.formGet_(fieldName);

  return (this.isDisabled_(field) || this.isReadOnly_(field)) || this.hasValue_(
      field.value);
};

/**
 * Gets a form element.
 * @private
 * @this forms.Validation
 * @param {string} fieldName Name of the HTML form field.
 * @return {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} Form
 *     element or elements.
 */
forms.Validation.prototype.formGet_ = function(fieldName) {
  if (this.form_.elements[fieldName]) {
    return this.form_.elements[fieldName];
  } else if (this.form_.elements[fieldName + '[]']) {
    return this.form_.elements[fieldName + '[]'];
  }
  return null;
};

/**
 * Changes the display type of an element.
 * @private
 * @this forms.Validation
 * @param {HTMLElement} element HTML Element to show.
 * @param {boolean} show True to show, false to hide.
 */
forms.Validation.prototype.display_ = function(
    element, show) {
  element.style.display = show ? this.errorDisplay: 'none';
};


/**
 * Helper class to get elements by class names.
 * @private
 * @param {string|Array} classes Class name(s) to search for.
 * @param {HTMLDocument|HTMLElement|null} parentEl Parent HTML element to
 *    search within.
 * @param {string?} tagName HTML tag name to search for.
 * @return {Array} Array of elements.
 */
forms.Validation.prototype.getElementsByClass_ = function(
    classes, parentEl, tagName) {
  parentEl = parentEl || document;
  tagName = tagName || '*';
  classes = (typeof classes === 'string') ? classes: classes.join('|');

  var matchedElements = [];
  var children = parentEl.getElementsByTagName(tagName);
  var expr = new RegExp('^[a-zA-Z0-9 -]*' + classes + '[a-zA-Z0-9 -]*$');

  for (var i = 0, len = children.length; i < len; i++) {
    if (expr.test(children[i].className)) {
      matchedElements.push(children[i]);
    }
  }
  return matchedElements;
};

/**
 * Exhaustive list of valid top-level domains.
 * Retrieved from: http://data.iana.org/TLD/tlds-alpha-by-domain.txt
 * Version 2008092501, Last Updated Fri Sep 26 08:07:00 2008 UTC.
 * @type {Array|string}
 * @private
 */
forms.Validation.prototype.topLevelDomains_ = '' +
      'ac|ad|ae|aero|af|ag|ai|al|am|an|ao|aq|ar|arpa|as|asia|at|au|aw|ax|' +
      'az|ba|bb|bd|be|bf|bg|bh|bi|biz|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|' +
      'cat|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|com|coop|cr|cu|cv|cx|cy|cz|de|' +
      'dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|' +
      'ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|' +
      'hu|id|ie|il|im|in|info|int|io|iq|ir|is|it|je|jm|jo|jobs|jp|ke|kg|' +
      'kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|' +
      'md|me|mg|mh|mil|mk|ml|mm|mn|mo|mobi|mp|mq|mr|ms|mt|mu|museum|mv|mw|' +
      'mx|my|mz|na|name|nc|ne|net|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|' +
      'pf|pg|ph|pk|pl|pm|pn|pr|pro|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|' +
      'sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|' +
      'th|tj|tk|tl|tm|tn|to|tp|tr|travel|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|' +
      'vc|ve|vg|vi|vn|vu|wf|ws|xn|ye|yt|yu|za|zm|zw';

goog.exportSymbol('forms.Validation', forms.Validation);
goog.exportProperty(forms.Validation.prototype, 'anchor',
                    forms.Validation.prototype.anchor);
goog.exportProperty(forms.Validation.prototype, 'errorTag',
                    forms.Validation.prototype.errorTag);
goog.exportProperty(forms.Validation.prototype, 'errorClass',
                    forms.Validation.prototype.errorClass);
goog.exportProperty(forms.Validation.prototype, 'errorDisplay',
                    forms.Validation.prototype.errorDisplay);
goog.exportProperty(forms.Validation.prototype, 'jump',
                    forms.Validation.prototype.jump);
goog.exportProperty(forms.Validation.prototype, 'multiClass',
                    forms.Validation.prototype.multiClass);
goog.exportProperty(forms.Validation.prototype, 'prefix',
                    forms.Validation.prototype.prefix);
goog.exportProperty(forms.Validation.prototype, 'suffix',
                    forms.Validation.prototype.suffix);
goog.exportProperty(forms.Validation.prototype, 'fileTypes',
                    forms.Validation.prototype.fileTypes);
goog.exportProperty(forms.Validation.prototype, 'validationExp',
                    forms.Validation.prototype.validationExp);
goog.exportProperty(forms.Validation.prototype, 'isValid',
                    forms.Validation.prototype.isValid);
goog.exportProperty(forms.Validation.prototype, 'hideAllErrors',
                    forms.Validation.prototype.hideAllErrors);
