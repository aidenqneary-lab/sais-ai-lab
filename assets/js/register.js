/* ============================================================
   AI Lab — registration form validation
   Client-side only: nothing is sent anywhere yet.
   ============================================================ */
(function () {
  'use strict';

  var form    = document.getElementById('register-form');
  var success = document.getElementById('form-success');
  var detail  = document.getElementById('success-detail');
  var resetBtn = document.getElementById('reset-form');
  if (!form) return;

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  // field id -> validity test
  var rules = {
    fullname: function (v) { return v.trim().length >= 2; },
    grade:    function (v) { return v !== ''; },
    email:    function (v) { return EMAIL_RE.test(v.trim()); },
    why:      function (v) { return v.trim().length >= 10; }
  };

  function fieldOf(input) { return input.closest('.field'); }

  function validate(input, showError) {
    var rule = rules[input.id];
    if (!rule) return true;
    var ok = rule(input.value);
    var wrap = fieldOf(input);
    if (wrap) {
      if (!ok && showError) wrap.classList.add('invalid');
      if (ok) wrap.classList.remove('invalid');
    }
    return ok;
  }

  // Re-check as the visitor types, but only after the field has been flagged once
  Object.keys(rules).forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    var ev = input.tagName === 'SELECT' ? 'change' : 'input';
    input.addEventListener(ev, function () {
      if (fieldOf(input).classList.contains('invalid')) validate(input, true);
    });
    input.addEventListener('blur', function () {
      if (input.value.trim() !== '') validate(input, true);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstBad = null;
    Object.keys(rules).forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      if (!validate(input, true) && !firstBad) firstBad = input;
    });

    if (firstBad) {
      // Bring the first problem into view and focus it
      var top = firstBad.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: top, behavior: 'smooth' });
      setTimeout(function () { firstBad.focus({ preventScroll: true }); }, 320);
      return;
    }

    // Passed — greet them by first name and swap the form for the confirmation
    var name = document.getElementById('fullname').value.trim().split(/\s+/)[0];
    if (detail) {
      detail.textContent = name
        ? 'Thanks, ' + name + '. We\'ve got your details and someone from the Lab will reach out soon.'
        : 'We\'ve got your details and someone from the Lab will reach out soon.';
    }

    form.style.display = 'none';
    success.classList.add('on');
    var top = success.getBoundingClientRect().top + window.scrollY - 160;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
      form.querySelectorAll('.field').forEach(function (f) { f.classList.remove('invalid'); });
      success.classList.remove('on');
      form.style.display = '';
      var top = form.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    });
  }
})();
