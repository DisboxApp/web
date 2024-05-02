import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";

function SearchBar({ fileManager, files = true, directories = true, rows,
     advanced = true, search = true, placeholder = "Search", onSelect, onEnter, onOptionsChanged, onChange }) {

    const [baseOptions, setBaseOptions] = useState(new Set());
    const [options, setOptions] = useState([]);
    const [byExtension, setByExtension] = useState({});


    useEffect(() => {
        if (fileManager === null) {
            return;
        }

        const options = [];
        const byExtension = {};

        const queue = [""];
        while (queue.length > 0) {
            const file = queue.pop();
            const files = fileManager.getChildren(file.path || file);
            Object.values(files).forEach(f => {
                if (f.type === "directory") {
                    queue.push(f);
                    if (directories) {
                        options.push(f.path);
                    }
                } else if (files && f.type === "file") {  
                    options.push(f.path);
                    const extension = f.path.split(".").pop().toLowerCase();
                    if (advanced) {
                        if (!byExtension[extension]) {
                            byExtension[extension] = [];
                        }
                        byExtension[extension].push(f.path);
                    }
                }
            });
        }
        setOptions(options);
        setBaseOptions(new Set(options));
        setByExtension(byExtension);

    }, [rows]);


    const setAutoCompleteOptions = (event, value) => {
        let newOptions = [];
        const parts = value.split(" ");
        const advancedParts = [];
        parts.forEach(part => {
            if (part.startsWith("ext:")) {
                advancedParts.push(part);
            }
        });
        let advancedOptions = [];
        advancedParts.forEach(part => {
            const index = parts.indexOf(part);
            parts.splice(index, 1);
            if (advanced) {
                const type = part.split(":")[1];
                if (byExtension[type]) {
                    advancedOptions.push(...byExtension[type]);
                }
            }
        });
        for (let option of baseOptions) {
            if (parts.some(part => option.toLowerCase().includes(part.toLowerCase()))) {
                newOptions.push(option);
            }
        }
        if (parts.join(" ") in baseOptions) {
            newOptions.unshift(parts.join(" "));
        }
        newOptions.push(...advancedOptions);
        newOptions = [...new Set(newOptions)];
        setOptions(newOptions);
        onOptionsChanged(newOptions);
    }
        


    return <Autocomplete
        freeSolo={search}
        clearIcon={null}
        renderInput={(params) => (
            <TextField
                {...params}
                label={placeholder}
                InputProps={{
                    ...params.InputProps,
                    type: 'search',
                }}
            />
        )}
        filterOptions={(x) => x}
        onInputChange={function (event, value) {
            setAutoCompleteOptions(event, value);
            if (onChange) { onChange(value); }
        }}
        onChange={function (event, value) {
            setAutoCompleteOptions(event, value);
            if (onChange) { onChange(value); }
            if (onSelect) { onSelect(value); }
        }}
        onKeyDown={(event) => {
            if (event.key === "Enter" && onEnter) {
                onEnter();
            }
        }}
        options={options}
    />
}

export default SearchBar;