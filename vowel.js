class IPACharset {
  constructor() {}
  idxToInt(closedness, frontedness, rounded) {
    if(rounded === 0.5) {
      rounded = 0; // correct for 0.5 for both rounded/unrounded
    }
    var openidx = 6 - closedness * 2;
    // turn the 0.5s into integers. Range: 0-3 -> 0-6 Len: 7
    var backidx = 4 - frontedness * 2;
    // turn the 0.5s into integers. Range: 0-2 -> 0-4 Len: 5
    // Rounded is already ok.       Range: 0-1        Len: 2
    var searchidx = rounded + backidx * 2 + openidx * 2 * 5;
    // 2 comes from len(rounded);
    // 10 comes from len(rounded x fronted) where x is cartesian product
    // or 10 comes from len(rounded) * len(fronted) = 2 * 5
    return searchidx;
  }
  toChar(closedness, frontedness, rounded) {
    var searchidx = this.idxToInt(closedness, frontedness, rounded);
    var ipachar = this.rfncstr[searchidx];
    if(ipachar === '.') {
      // i use '.' to signify no result
      console.log(`invalid char ${closedness},${frontedness},${rounded}`)
    } else {
      return ipachar;
    }
  }
  charToIdx(ipachar, rfncstr=undefined) {

    // REQUIREMENT: In rfncstr,
    //  all chars must appear once and only once.
    // EXCEPTION: the blank char '.' may appear more than once.
    // EXCEPTION: chars may appear twice if and only if they
    //  appear twice in a row, directly adjacent to each other,
    //  indicating that that char represents both the
    //  rounded and unrounded versions of itself.
    //  For example, ʊ shows up in rfncstr
    //  ɪʏʊʊe because ʊ is both the rounded and unrounded version

    // check for those two-char adjacencies, indicating
    // both rounded and unrounded version.
    // Thus roundedness must be 0.5;

    if(rfncstr === undefined) {
      rfncstr = this.rfncstr;
    }
    var idxdouble = rfncstr.indexOf(ipachar + '' + ipachar);
    var rounded = -1;
    if(idxdouble > -1) { // if there is a double version: if both r and unr
      rounded = 0.5;
    }
    var idx = rfncstr.indexOf(ipachar);
    if(idx > -1) {
      if(rounded === -1) {
        var rounded = idx % 2;
      }
      var backidx = parseInt(idx/2) % 5;
      var openidx = parseInt(idx/10);
      var closedness = (6 - openidx) / 2;
      var frontedness = (4 - backidx) / 2;
      return [closedness, frontedness, rounded];
    } else {
      console.log(`char not found ${ipachar}`);
    }
  }
}
var basic_validchars = 'iyɨʉɯuɪʏʊeøɘɵɤoəɛœɜɞʌɔæɐaɶɑɒ'.split('');
class IPACharsetBasic extends IPACharset {
  constructor() {
    super();
    this.rfncstr =
    'iy..ɨʉ..ɯu'+
    '..ɪʏ..ʊʊ..'+
    'eø..ɘɵ..ɤo'+
    '....əə....'+
    'ɛœ..ɜɞ..ʌɔ'+
    'ææ..ɐɐ....'+
    'aɶ......ɑɒ';
    this.validchars = basic_validchars;
  }
}
var adv_extras = ['ä','e̞','ø̞','ɤ̞','o̞'];
var adv_validchars = basic_validchars.concat(adv_extras);
class IPACharsetAdvanced extends IPACharsetBasic{
  constructor() {
    super();
    this.rfncstr =
    'iy..ɨʉ..ɯu'+
    '..ɪʏ..ʊʊ..'+
    'eø..ɘɵ..ɤo'+
    '....əə....'+
    'ɛœ..ɜɞ..ʌɔ'+
    'ææ..ɐɐ....'+
    'aɶ..ä...ɑɒ';
    this.lowerset =
    '..........'+
    '..........'+
    '..........'+
    'eø......ɤo'+
    '..........'+
    '..........'+
    '..........';
    this.lowerchar = "\u031E";
    this.validchars = adv_validchars;
  }
  toChar(closedness, frontedness, rounded) {
    var idx = this.idxToInt(closedness, frontedness, rounded)
    var ch = super.toChar(closedness, frontedness, rounded);
    if(this.lowerset[idx] !== '.') {
      // if we're looking at a diacritic-able
      return this.lowerset[idx] + this.lowerchar;
    } else {
      return ch;
    }
  }
  charToIdx(charseq) {
    if(charseq.length === 2) {
      // diacritic moment
      var norm = charseq[0];
      var dia = charseq[1];
      if (dia === this.lowerchar) {
        // diacritic moment moment

        // use lowerset as our rfncstr.
        // Since the second character was a diacritic, we look for the first
        // character, our "normal" character, like ø, in lowerset.
        // we do a check. first make sure it's not a period:
        if(norm === '.') {
          console.log(`char not found ${charseq}`);
          return;
        }
        // then we make sure ø or Θ is in lowerset
        if(this.lowerset.includes(norm)) {
          // If it was found in lowerset, then
          // Our normal character will be in the correct specified
          // position and will return clo, fro, ro.
          return super.charToIdx(norm, this.lowerset);
        } else {
          // if our input was something dumb like ̞Θ, where the char isn't a vowel
          console.log(`char not found ${charseq}`);
          return;
        }

      }
    } else {
      return super.charToIdx(charseq);
    }
  }
}

const basic_charset = new IPACharsetBasic();
const adv_charset = new IPACharsetAdvanced();
var charset = basic_charset;

function init() { // called on page load
  console.log("init()");
  var checkbox = document.getElementById('checkbox')
  checkbox.addEventListener('change', (event) => {
    if (event.currentTarget.checked) {
      charset = adv_charset;
      createAdvBoxes();
    } else {
      charset = basic_charset;
      removeAdvBoxes();
    }
  });
  createBoxes();
}
function createBoxes(charsetin) {
  if(charsetin === undefined) {
    charsetin = charset;
    if(charset === adv_charset) {
      // TODO: doesn't work yet, the advanced boxes aren't given a adv class
      console.log("Unready to use advanced charset: advanced boxes aren't given a adv class! ")
    }
  }
  for(let charseq of charsetin.validchars) {
    var [closedness, frontedness, rounded] = charToIdx(charseq);
    addBox(charseq, closedness, frontedness, rounded);
  }
}
function createAdvBoxes(charsetin) {
  for(let charseq of adv_extras) {
    var [closedness, frontedness, rounded] = charToIdx(charseq);
    addBox(charseq, closedness, frontedness, rounded, true);
  }
}
function removeAllBoxes() {
  var boxes = document.getElementsByClassName("movable ixv IPA");
  while(boxes.length){ // see https://stackoverflow.com/questions/18410450/javascript-not-removing-all-elements-within-a-div
    boxes[0].parentNode.removeChild(boxes[0]);
  }
}
function removeAdvBoxes() {
  var boxes = document.getElementsByClassName("movable ixv IPA adv");
  while(boxes.length){ // see https://stackoverflow.com/questions/18410450/javascript-not-removing-all-elements-within-a-div
    boxes[0].parentNode.removeChild(boxes[0]);
  }
}
function addVowel(divclass, str, closedness, frontedness, rounded, extra='') {
  document.getElementsByClassName("vowelspace")[0].innerHTML
   += `<div class="${divclass}" ${extra} style="--closedness: ${closedness}/3; --frontedness: ${frontedness}/2; --rounded: ${rounded};"> ${str}</div>`
}
function addBox(char, closedness, frontedness, rounded, adv=false) {
  addVowel(`movable ixv IPA${adv ? " adv" : ""}`, char,
  closedness, frontedness, rounded,
  `id="v${closedness}-${frontedness}-${rounded}""`);
}
function addDot(closedness, frontedness) {
  // document.getElementsByClassName("vowels")[0].innerHTML
  //  += "<div class=\"arbitrarydot\" "
  //  + "style=\"--closedness: "+closedness+"/3; "
  //  + "--frontedness: "+frontedness+"/2;"
  //  + "--roundedness: 0.5;"
  //  +  "\">•</div>";
  addVowel('arbitrarydot', '•', closedness, frontedness, 0.5);
}

function fragmentize(str, charsetin) {
  if(charsetin === undefined) {
    charsetin = charset;
  }
  var frags = []; // an array of string fragments, each of which represent either nonrecognized characters or a vowels
  // for example ['f','ɜ','rm','ə','r' ]
  var buildup = '';
  for(let char of str) { // TODO: split by diacritic
    if (charset.validchars.indexOf(char) > -1) { // if char found; if vowel
      if(buildup) {
        frags.push(buildup);
      }
      frags.push(char);
      buildup = '';
    } else { // if char not found; if consonant
      buildup = buildup + '' + char;
    }
  }
  if(buildup) {
    frags.push(buildup);
  }
  // now we have string fragments
  return frags;
}
function onSubmit() {
  var querystr = document.getElementsByClassName("analyzer")[0].value;
  console.log(querystr);
  var htmlbuild = " ";
  var frags = fragmentize(querystr);
  for(let frag of frags) {
    if(frag.length === 1 && validchars.includes(frag)) {
      // if it's a lone vowel, box it
      // TODO: investigate XSS here. I think we should be relatively safe becuase it's only 1 char? (Famous Last Words)
      htmlbuild += `<span class="alyt" onmouseover="onIn('${frag}')" onmouseout="onOut('${frag}')">${frag}</span>`;
    } else {
      htmlbuild += frag;
    }
  }
  console.log(htmlbuild);
  document.getElementsByClassName("analyte")[0].innerHTML += htmlbuild; // TODO XSS
}
function onIn(ipachar) {onHover(ipachar, true);}
function onOut(ipachar) {onHover(ipachar, false);}
function onHover(ipachar, doHover) {
  var clo, fro, ro;
  [clo, fro, ro] = charToIdx(ipachar);
  var ele = idxToElement(clo, fro, ro);
  if(doHover) {
    if(!ele.classList.contains("hovered")) {
      ele.classList.add("hovered");
    }
  } else {
    if(ele.classList.contains("hovered")) {
      ele.classList.remove("hovered");
    }
  }
}
var rfncstr = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤo....əə....ɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ......ɑɒ';
var extendd = 'iy..ɨʉ..ɯu..ɪʏ..ʊʊ..eø..ɘɵ..ɤoeø..əə..ɤoɛœ..ɜɞ..ʌɔææ..ɐɐ....aɶ..ä...ɑɒ';
var addlowr = '..............................ll......ll...............................';
var validchars = 'iyɨʉɯuɪʏʊʊeøɘɵɤoəəɛœɜɞʌɔææɐɐaɶɑɒ';
function toChar(closedness, frontedness, rounded) {
  return charset.toChar(closedness, frontedness, rounded);
}
function charToIdx(ipachar) {
  return charset.charToIdx(ipachar);
}
function idxToElement(closedness, frontedness, rounded) {
  if(rounded === 0.5) {
    // rounded = 0;
    // nah it's initialized by charToIdx() so it expects 0.5

  }
  // actually some don't work.
  // For instance the schwa ə, if referred to as
  // closed: 1.5 front: 1 rounded: 0
  // doesn't work, because it expects rounded: 0.5
  // therefore to make it work we make idxs -> char
  // (which char is guaranteed b/c surjective)
  // then char -> idxs (think of this as the "principal root, if you will")
  // and in total idxs -> principle idxs
  var ipachar = toChar(closedness, frontedness, rounded);
  var [closedness, frontedness, rounded] = charToIdx(ipachar);
  return document.getElementById(`v${closedness}-${frontedness}-${rounded}`)
}
function removeDup(str) {
  var build = "";
  for(let ipachar of str) {
    if(build.includes(ipachar) || ipachar === '.') {
      // do nothing
    } else {
      build += ipachar;
    }
  }
  return build;
}
