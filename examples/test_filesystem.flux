# Test File System Library  
FLOW io

~ "data.txt"
| read_file()
| print("File content: ")

~ "Hello, Fluxus!"
| write_file("output.txt")
| print("Write result: ")

~ "/home/user/documents"
| list_files()
| print("Directory listing: ")
