const XLSX = require('xlsx');

module.exports = {
    do : do_compare
}

function do_compare(params) {
    console.log(`Comparing Excel files ${JSON.stringify(params)}`);
    // Prepare the input file
    // https://www.npmjs.com/package/xlsx
    var inputWorkbook = XLSX.readFile(params.file1);
    var inputWorksheet = inputWorkbook.Sheets[params.sheet];
    var inputArray = XLSX.utils.sheet_to_json(inputWorksheet,{defval:''});

    // Prepare the searched file
    // https://www.npmjs.com/package/xlsx
    var searchedWorkbook = XLSX.readFile(params.file2);
    var searchedWorksheet = searchedWorkbook.Sheets[params.sheet];
    var searchedArray = XLSX.utils.sheet_to_json(searchedWorksheet,{defval:''});

    // Not found items - Array & string
    var ret = [];

    /*      OUTER LOOP
            Loop search cells in input file */
    inputArray.forEach((input,outer) => {
        // get the searched value from input file changecolumn C
        var desired_C_cell = input[params.changecolumn].replace(/-/g, '');
        var confirm_C_cell = '';
        if (params.nochangecolumn !== '') confirm_C_cell = input[params.nochangecolumn];

        // INNER LOOP - searches the searched File
        var found = searchedArray.find(searched => {
            // we use replace function to normalise search value
            // Example: changes 978-879-89-21-234 to 9788798921234 
            return (searched[params.changecolumn] !== undefined?searched[params.changecolumn]:'')
                    .replace(/-/g, '').includes(desired_C_cell)
            }); // end of inner loop

        if (found !== undefined)
            if (confirm_C_cell !== '') {
                if (found[params.nochangecolumn] === confirm_C_cell)
                    return;
                }
            else return;
        if (confirm_C_cell === '')
            ret.push(input);
        });   // END OUTER LOOP

    // Out of the both loops so print not found items
    console.log(`Returning ${ret.length} rows`);
    return ret;
    }