macro __rejectAwait {
  case { _ $body ... } => {
    letstx $await = [makeIdent('await', #{$body ...}[0])];
    return #{
      macro $await {
        case { $name:ident $e:expr } => {
          throwSyntaxError('await', 'cannot use await keyword outside of async function', #{$name});
        }
      }
      $body ...
    }
  }
}
macro __injectAwait {
  case { _ $body ... } => {
    letstx $await = [makeIdent('await', #{$body ...}[0])];
    letstx $function = [makeIdent('function', #{$body ...}[0])];
    return #{
      macro $function {
        rule { $name ($[$params ...]) { $[$mbody ...] } } => {
          function $name ($[$params ...]) { __rejectAwait $[$mbody ...] }
        }
        rule { ($params $[...]) { $mbody $[...] } } => {
          function ($params $[...]) { __rejectAwait $mbody $[...] }
        }
      }
      macro $await {
        rule { $e:expr } => { yield __rejectAwait $e }
      }
      $body ...
    }
  }
}

let async = macro {
  rule { function $name ($params ...) { $body ...} } => {
    var $name = require('q').async(function * $name ($params ...) { __injectAwait $body ... })
  }
  rule { function ($params ...) { $body ...} } => {
    require('q').async(function * ($params ...) { __injectAwait $body ... })
  }
}
export async;


macro await {
  case { $name:ident $e:expr } => {
    throwSyntaxError('await', 'cannot use await keyword outside of async function', #{$name});
  }
}
export await;

let var = macro {
  rule { $name:ident = $value:expr } => {
    var $name = $value
  }

  rule { {$name:ident (,) ...} = $value:expr } => {
    var object = $value
    $(, $name = object.$name) ...
  }

  rule { [$name:ident (,) ...] = $value:expr } => {
    var array = $value, index = 0
    $(, $name = array[index++]) ...
  }
}

export var;
