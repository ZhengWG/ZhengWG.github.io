

def read_lines(input_file, striped=False):
    for line in open(input_file, 'r'):
        if striped:
            yield line.strip()
        else:
            yield line

def write_lines(lines, out_path):
    with open(out_path, 'w') as f:
        for line in lines:
            f.write(f"{line}\n")