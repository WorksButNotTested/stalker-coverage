# stalker-coverage
Stalker coverage is a small TypeScript module designed to be used with [FRIDA](https://frida.re/) to generate coverage information in [DynamoRio DRCOV](https://dynamorio.org/dynamorio_docs/page_drcov.html) format. This information can then be loaded into IDA using the [lighthouse](https://github.com/gaasedelen/lighthouse) plugin or Ghidra using the [Dragondance](https://github.com/0ffffffffh/dragondance) plugin.

# Example
## Source Code
The following C code will be used as our example:
```c
#include <stdio.h>
#include <stdlib.h>

long square(long x)
{
    return x * x;
}

int main(int argc, char *argv[])
{
    if (argc < 2) {
        printf("Give me an argument!\n");
        return 1;
    }

    long x = strtol(argv[1], NULL, 0);
    long sq_x = square(x);
    printf("%ld squared is %ld\n", x, sq_x);
    return 0;
}
```
We first compile the code as follows (note the use of the `-rdynamic` flag to allow FRIDA to more readily find the function):
```bash
$ gcc -rdynamic -o test test.c
```
## Project
We can then start using the [frida-agent-example](https://github.com/oleavr/frida-agent-example) as a template project and install the `stalker-coverage` module:
```bash
$ npm install
$ npm install --save ./stalker-coverage
```
## Using Stalker-Coverage
We can then interact with this module using the following typescript code
(put this in `frida-agent-example/agent/index.ts`):
```typescript
import { Coverage } from "@worksbutnottested/stalker-coverage/dist/coverage";
/*
 * This sample replaces the 'main' function of the target application with one which starts
 * collecting coverage information, before calling the original 'main' function. Once the
 * original 'main' function returns, coverage collection is stopped. This coverage
 * information is written into a file which can then be directly loaded into IDA lighthouse
 * or Ghidra Dragondance.
 */

/*
 * The address of the symbol 'main' which is to be used as the start and finish point to
 * collect coverage information.
 */
const mainAddress = DebugSymbol.fromName("main").address;

/**
 * The main module for the program for which we will collect coverage information (we will
 * not collect coverage information for any library dependencies).
 */
const mainModule = Process.enumerateModules()[0];

/*
 * A NativeFunction type for the 'main' function which will be used to call the original
 * function.
 */
const mainFunctionPointer = new NativeFunction(
    mainAddress,
    "int",
    ["int", "pointer"],
    { traps : "all"});

/*
 * A function to be used to replace the 'main' function. This function will start collecting
 * coverage information before calling the original 'main' function. Once this function
 * returns, the coverage collection will be stopped and flushed. Note that we cannot use
 * Interceptor.attach here, since this interferes with Stalker (which is used to provide the
 * coverage data).
 */
const mainReplacement = new NativeCallback(
    (argc, argv) => {
        const coverageFileName = `${mainModule.path}.dat`;
        const coverageFile = new File(coverageFileName, "wb+");

        const coverage = Coverage.start({
            moduleFilter: (m) => Coverage.mainModule(m),
            onCoverage: (coverageData) => {
                coverageFile.write(coverageData);
            },
            threadFilter: (t) => Coverage.currentThread(t),
        });

        const ret = mainFunctionPointer(argc, argv) as number;

        coverage.stop();
        coverageFile.close();

        return ret;
    },
    "int",
    ["int", "pointer"]);

/*
 * Replace the 'main' function with our replacement function defined above.
 */
Interceptor.replace(mainAddress, mainReplacement);
```
We can build our project using the following command:
```
$ npm run build
```
## Running
First we must download the FRIDA gadget from [here](https://github.com/frida/frida/releases) (be sure to rename it `frida-gadget.so`) and create a configuration file called `frida-gadget.config`
```json
{
  "interaction": {
    "type": "script",
    "path": "./_agent.js"
  }
}
```

Now we can run our application and collect the coverage information as follows:
```
$ LD_PRELOAD=./frida-gadget.so ./test 123
123 squared is 15129
```
Coverage data should be stored along-side our test application in `test.dat`. This file can then de directly loaded into ghidra using the [Dragondance](https://github.com/0ffffffffh/dragondance) plugin.

## Screenshots
We can then see the resulting coverage data inside of ghidra using the [Dragondance](https://github.com/0ffffffffh/dragondance) plugin.
![Coverage1.png](https://github.com/WorksButNotTested/stalker-coverage/raw/master/img/Coverage1.png)
![Coverage2.png](https://github.com/WorksButNotTested/stalker-coverage/raw/master/img/Coverage2.png)
